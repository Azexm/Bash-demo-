import { Suspense } from "react";
import BookingPage from "@/views/BookingPage";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <BookingPage />
        </Suspense>
    );
}
