import { Link, Head } from '@inertiajs/react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    return (
        <>
            <Head title="G-voice" />
            <head>
                <title>Pusher Test</title>
                <script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>
            </head>
        </>
    );
}
