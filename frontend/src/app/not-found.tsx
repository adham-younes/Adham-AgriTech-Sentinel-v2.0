import Link from "next/link"

export const dynamic = "force-dynamic"

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
            <h2 className="text-4xl font-bold">404 - Page Not Found</h2>
            <p className="mt-4 text-muted-foreground">Could not find requested resource</p>
            <Link href="/dashboard" className="mt-8 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
                Return to Dashboard
            </Link>
        </div>
    )
}
