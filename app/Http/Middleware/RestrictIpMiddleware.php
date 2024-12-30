<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestrictIpMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // 許可するIPアドレスを定義
        $allowedIps = [
            // 許可するIPアドレス。watch-prjコンテナのみを許可する
            '127.0.0.1'
        ];

        // クライアントのIPアドレスをチェック
        if (!in_array($request->ip(), $allowedIps)) {
            return response()->json(['error' => 'Unauthorized.'], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
