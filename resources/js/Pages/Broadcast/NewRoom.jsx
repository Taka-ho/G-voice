import GuestLayout from '@/Layouts/GuestLayout';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function NewRoom() {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        broadcastExplain: ''
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('broadcast.create'));
    };
    return (
        <GuestLayout>
            <Head title="配信開始" />
            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="title" value="タイトル" />
                    <TextInput
                        id="title"
                        name="title"
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        placeholder='タイトル'
                        onChange={(e) => setData('title', e.target.value)}
                    />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="broadcastExplain" value="説明欄" />
                    <textarea
                        id="explain"
                        name="broadcastExplain"
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        placeholder='配信概要'
                        onChange={(e) => setData('broadcastExplain', e.target.value)}
                    />
                </div>

                <div className="flex items-center justify-end mt-4">
                    <PrimaryButton className="ms-4 bg-orange-600 hover:bg-orange-500" disabled={processing}>
                        配信を開始する
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
