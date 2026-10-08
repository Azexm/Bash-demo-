"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Minimal react-router NavLink equivalent (className can be a function of { isActive })
export default function NavLink({ href, end = false, className, children, ...rest }) {
    const pathname = usePathname();
    const isActive = end
        ? pathname === href
        : pathname === href || pathname.startsWith(href + "/");
    return (
        <Link
            href={href}
            className={typeof className === "function" ? className({ isActive }) : className}
            {...rest}
        >
            {children}
        </Link>
    );
}
