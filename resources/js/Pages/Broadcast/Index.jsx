import {useEffect, useRef} from "react";

export default function Index(props) {

    // User
    const user = props.user;
    const otherUsers = props.otherUsers;

    // Pusher
    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;

    // Video
    const myVideoRef = useRef(null);
    const otherVideoRef = useRef(null);
    const videoStreamRef = useRef(null);
    const videoChannelRef = useRef(null);
    const peers = useRef({});
    const getEventName = userId => `client-signal-${userId}`;
    const getPeer = (targetUserId, initiator) => {

        if(peers.current[targetUserId] === undefined) {

            const peer = new Peer({
                initiator,
                stream: videoStreamRef.current,
                trickle: false,
            });

            peer
                .on('signal', data => {

                    const eventName = getEventName(targetUserId);
                    videoChannelRef.current.trigger(eventName, {
                        userId: user.id,
                        data: data,
                    });

                })
                .on('stream', stream => otherVideoRef.current.srcObject = stream)
                .on('close', () => deletePeer(targetUserId));

            // 通話するユーザーを追加
            peers.current = {
                ...peers.current,
                ...{ [targetUserId]: peer }
            };

        }

        return peers.current[targetUserId];

    };
    const deletePeer = userId => {

        const peer = peers.current[userId];

        if(peer !== undefined) {

            peer.destroy();

        }

        const { [userId]: _, ...newPeers } = peers.current; // 該当するユーザーを削除
        peers.current = newPeers;

    };
    useEffect(() => {

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {

                myVideoRef.current.srcObject = stream;
                videoStreamRef.current = stream;

                const pusher = new Pusher(pusherKey, {
                    authEndpoint: '/broadcasting/auth',
                    cluster: pusherCluster,
                });
                const channel = pusher.subscribe('private-video-call');
                const eventName = getEventName(user.id);
                channel.bind(eventName, signal => {

                    const userId = signal.userId;
                    const peer = getPeer(userId, false);
                    peer.signal(signal.data);

                });
                videoChannelRef.current = channel;

            });

    }, []);

    return (
        <div className="p-5 bg-gray-100">
            <div className="flex">
            </div>
        </div>
    );

}
