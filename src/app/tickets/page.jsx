import { Suspense } from "react";
import MyTicketsPage from "@/views/MyTicketsPage";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <MyTicketsPage />
        </Suspense>
    );
}
