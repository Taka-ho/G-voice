<?php
namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class RunContainerProcess implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $rootDirPath;
    protected $triggerFilePath;

    public function __construct($rootDirPath, $triggerFilePath)
    {
        $this->rootDirPath = $rootDirPath;
        $this->triggerFilePath = $triggerFilePath;
    }

    public function handle()
    {
        $urlParam = Str::uuid();
        $contentsArray = $this->makeContainer($urlParam);
        $containerId = $contentsArray['Id'];
        $this->startContainer($containerId);
        $this->copyInContainer($containerId, $this->rootDirPath);
        $this->runCode($this->rootDirPath, $this->triggerFilePath, $containerId);
    }

    private function makeContainer($urlParam)
    {
        $param = [
            'Image' => 'execute-code',
            'Cmd' => [
                "npm", "start"
            ],
            'Env' => [
                "paramOfUrl={$urlParam}"
            ],
        ];

        $url = 'http://host.docker.internal:2375/containers/create';
        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($url, $param);

        if (!$response->successful()) {
            Log::error("HTTP Error(make): " . $response);
            return null;
        }

        return $response->json();
    }

    private function startContainer($containerId)
    {
        $startURL = "http://host.docker.internal:2375/containers/$containerId/start";
        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($startURL);

        if (!$response->successful()) {
            Log::error("HTTP Error(start): " . $response->status());
            return null;
        }
    }

    private function copyInContainer($containerId, $rootDirPath)
    {
        $tarFilePath = $this->archiveToTar($rootDirPath);
        $fileStream = fopen($tarFilePath, 'r');

        $url = "http://host.docker.internal:2375/containers/$containerId/archive?path=/app";

        Http::withHeaders([
            'Content-Type' => 'application/x-tar',
        ])->withBody($fileStream, 'application/x-tar')->put($url);
        fclose($fileStream);
    }

    private function archiveToTar($rootDirPath)
    {
        // アーカイブを保存するディレクトリ
        $destinationDirPath = storage_path('app/tarFiles');
        $tarFileName = str_replace("usersDir/", "", $rootDirPath);
        // アーカイブファイル名（パスを含む）
        $archiveFilePath = $destinationDirPath . "/$tarFileName.tar";
        // 元のディレクトリのフルパス
        $sourceDirPath = storage_path('app/' . $rootDirPath);

        // ディレクトリをアーカイブするためのtarコマンドを作成
        $command = "tar -cvf $archiveFilePath -C " . escapeshellarg(dirname($sourceDirPath)) . " " . escapeshellarg(basename($sourceDirPath));
        exec($command);

        return $archiveFilePath;
    }

    private function runCode($rootDirPath, $triggerFilePath, $containerId)
    {
        $targetDir = str_replace("usersDir/", "", $rootDirPath);
        $fileExtension = $this->judgeFileKind($triggerFilePath);
        $command = $this->choiceCommand($fileExtension, $triggerFilePath);

        // コンテナ内でコマンドを実行し、result.logに出力する
        $execUrl = "http://host.docker.internal:2375/containers/$containerId/exec";
        $execParam = [
            "AttachStdout" => true,
            "AttachStderr" => true,
            "Cmd" => [
                "bash", "-c",
                "touch /app/result.log &&
                cd $targetDir &&
                $command >> /app/result.log 2>&1"
            ]
        ];
        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($execUrl, $execParam);
        $array = json_decode($response->body(), true);
        $execId = $array['Id'];

        // コマンドを実行
        Http::post("http://host.docker.internal:2375/exec/$execId/start", [
            "Detach" => false,
            "Tty" => true
        ]);

        $this->getAfterCode($containerId, $targetDir);
        $this->getLog($containerId, $targetDir);
        Log::debug('JSONデータの値：'.print_r($this->readDirectory($targetDir), true));
    }

    private function judgeFileKind($triggerFilePath)
    {
        return pathinfo($triggerFilePath, PATHINFO_EXTENSION);
    }

    private function choiceCommand ($fileExtension, $triggerFilePath)
    {
        $filePath = preg_replace('/^\//', '', $triggerFilePath, 1);
        switch ($fileExtension) {
            case "php":
                Log::debug('$commandの値：'."php ". $filePath);
                return "php ". $filePath;
            case "ruby":
                Log::debug('$commandの値：'."ruby ". $filePath);
                return "ruby ". $filePath;
            case "java":
                Log::debug('$commandの値：'."java -jar ". $filePath);
                return "java -jar ". $filePath;
            case "Java":
                Log::debug('$commandの値：'."java -jar ". $filePath);
                return "java -jar ". $filePath;
            case "js":
                Log::debug('$commandの値：'."node ". $filePath);
                return "node ". $filePath;
            case "python":
                Log::debug('$commandの値：'."python ". $filePath);
                return "python ". $filePath;
            case "ts":
                Log::debug('$commandの値：'."npx ts-node ". $filePath);
                return "npx ts-node ". $filePath;

            default:
                return "Unsupported language";
        }
    }

    private function getAfterCode($containerId, $targetDir)
    {
        // Docker コンテナーからデータを取得する URL
        $urlOfCode = "http://host.docker.internal:2375/containers/$containerId/archive?path=/app/$targetDir";
        $codeResponse = Http::get($urlOfCode);
        $content = $codeResponse->body();

        $tempFilePath = tempnam(sys_get_temp_dir(), 'docker_data_');
        file_put_contents($tempFilePath, $content);
        $fileNameOfTar = uniqid();
        Storage::putFileAs('afterExec', $tempFilePath, "$fileNameOfTar.tar");
        $this->extractTarFile($fileNameOfTar, 'usersDir');
    }

    public function extractTarFile($fileNameOfTar, $extractTo)
    {
        $tarFilePath = escapeshellarg(storage_path("app/afterExec/$fileNameOfTar.tar"));
        $destinationPath = escapeshellarg(storage_path("app/$extractTo"));
        $command = "tar -xf $tarFilePath -C $destinationPath";

        exec($command, $output, $returnVar);
        if ($returnVar !== 0) {
            throw new \Exception("tar ファイルの解凍に失敗しました。");
        }
    }

    private function getLog($containerId, $targetDir)
    {
        $logUrl = "http://host.docker.internal:2375/containers/$containerId/archive?path=/app/result.log";
        $logResponse = Http::get($logUrl);
        $logContent = $logResponse->body();
        $tempFilePath = tempnam(sys_get_temp_dir(), 'docker_data_');
        file_put_contents($tempFilePath, $logContent);
        $fileNameOfTar = uniqid();
        Storage::putFileAs('afterExec', $tempFilePath, "$fileNameOfTar.tar");

        $tarFilePath = escapeshellarg(storage_path("app/afterExec/$fileNameOfTar.tar"));
        $destinationPath = escapeshellarg(storage_path("app/usersDir/$targetDir"));
        $command = "tar -xf $tarFilePath -C $destinationPath";

        exec($command, $output, $returnVar);
        if ($returnVar !== 0) {
            throw new \Exception("tar ファイルの解凍に失敗しました。");
        }
        return $logContent;
    }

    private function readDirectory($targetDir)
    {
        $result = [];

        // 指定されたディレクトリ内のファイルとディレクトリのリストを取得
        $directory = "storage/app/usersDir/$targetDir";
        $contents = [];
        // DirectoryIteratorを使用してディレクトリ内をループ
        foreach (new \DirectoryIterator($directory) as $item) {
            if (!$item->isDot()) {
                array_push($contents, $item->getFilename());
            }
        }

        foreach ($contents as $path) {
            $isDirectory = File::isDirectory($path); // Fileファサードを使用
    
            // ディレクトリの場合は再帰的に処理してchildrenに格納
            if ($isDirectory) {
                $directoryName = basename($path);
                $result[] = [
                    'id' => uniqid(),
                    'name' => $directoryName,
                    'children' => $this->readDirectory($path),
                ];
            } else {
                // ファイルの場合はファイルの内容を取得し、配列に格納
                $fileName = basename($path);
                // result.log ファイルの場合はスキップ
                if ($fileName === 'result.log') {
                    continue;
                }

                $fileContents = File::get($path); // Fileファサードを使用
                $result[] = [
                    'id' => uniqid(),
                    'name' => $fileName,
                    'content' => $fileContents,
                ];
            }
        }

        return $result;
    }
/*
    private function stopContainer($containerId)
    {
        $stopURL = "http://host.docker.internal:2375/containers/$containerId/stop";
        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($stopURL);

        if (!$response->successful()) {
            Log::error("HTTP Error(stop): " . $response->status());
            return null;
        }
    }
**/
}
