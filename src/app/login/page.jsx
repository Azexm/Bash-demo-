import { Suspense } from "react";
import AuthPage from "@/views/AuthPage";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <AuthPage mode="login" />
        </Suspense>
    );
}
