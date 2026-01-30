export function ProductBadges({ badges = [] }: { badges?: any[] }) {
    if (!badges.length) return null

    return (
        <div className="flex gap-2 flex-wrap">
            {badges.map((b: any) =>
                b.image_url ? (
                    <img
                        key={b.id}
                        src={b.image_url}
                        alt={b.name}
                        title={b.name}
                        className="h-6"
                    />
                ) : null
            )}
        </div>
    )
}
