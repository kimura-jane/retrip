import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RoomRow = {
  id: string;
  name: string;
  description: string | null;
  requires_verification: boolean;
  sort_order: number;
};

export default async function ChatListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 自分の本人確認状態を確認
  const { data: profileData } = await supabase
    .from("users")
    .select("id_verified")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileData as { id_verified: boolean } | null;
  const isVerified = profile?.id_verified === true;

  // 部屋一覧取得（RLSが効いてるので、見えるものだけ返ってくる）
  const { data: roomsData } = await supabase
    .from("chat_rooms")
    .select("id,name,description,requires_verification,sort_order")
    .eq("room_type", "lounge")
    .order("sort_order", { ascending: true });

  const rooms = (roomsData as RoomRow[] | null) ?? [];

  const publicRooms = rooms.filter((r) => !r.requires_verification);
  const verifiedRooms = rooms.filter((r) => r.requires_verification);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-neutral-800">チャット</h1>
        <p className="text-sm text-neutral-600 mt-2">
          他の旅人たちと自由におしゃべりしましょう
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-700 tracking-wider">
          みんなの広場
        </h2>
        <div className="space-y-2">
          {publicRooms.map((room) => (
            <Link key={room.id} href={`/chat/${room.id}`}>
              <Card className="hover:bg-neutral-50 transition cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-800">{room.name}</p>
                      {room.description && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {room.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {isVerified ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-neutral-700 tracking-wider">
              本人確認済みエリア
            </h2>
            <Badge variant="default" className="text-[10px]">認証済み</Badge>
          </div>
          <div className="space-y-2">
            {verifiedRooms.map((room) => (
              <Link key={room.id} href={`/chat/${room.id}`}>
                <Card className="hover:bg-neutral-50 transition cursor-pointer border-brand-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-800">{room.name}</p>
                        {room.description && (
                          <p className="text-xs text-neutral-500 mt-1">
                            {room.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-5 text-sm text-neutral-600 leading-relaxed">
            <p className="font-medium text-neutral-800 mb-2">
              🔒 本人確認済みエリアもあります
            </p>
            <p>
              本人確認を済ませると、「希望の目的地板」「感想板」など、
              ツアー参加者だけの板にも参加できるようになります。
            </p>
            <Link
              href="/mypage/id-upload"
              className="inline-block mt-3 text-brand-600 hover:underline text-sm"
            >
              本人確認書類を提出する →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
