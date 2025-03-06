import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import InfiniteScroll from './Broadcast/BroadcastingRooms/InfiniteScroll.jsx'; // 拡張子を省略している場合、注意

export default function Dashboard({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">マイページ</h2>}
        >
            <Head title="G-voice" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">おすすめの配信</div>
                        <InfiniteScroll />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
