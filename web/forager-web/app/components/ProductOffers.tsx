export function ProductOffers({ offers }: any) {
    return (
        <div className="space-y-1 text-sm">
            {offers.map((o: any, i: number) => (
                <div key={i}>
                    <b>{o.retailer_name}</b>: {o.price} {o.currency}
                </div>
            ))}
        </div>
    )
}
