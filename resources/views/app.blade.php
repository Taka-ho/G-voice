<!DOCTYPE html>
<html lang="ja">
    <head>
        <meta charset="utf-8">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(["resources/js/Pages/{$page['component']}.jsx", 'resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
