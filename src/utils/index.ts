export function bankersRoundingTruncateToInt(num: number): number {
    return bankersRounding(num, 0);
}

export function bankersRounding(
    num: number,
    decimalPlaces: number = 2
): number {
    const d = decimalPlaces;
    const m = Math.pow(10, d);
    const n = +(d ? num * m : num).toFixed(8); // Avoid rounding errors
    const i = Math.floor(n),
        f = n - i;
    const e = 1e-8; // Allow for rounding errors in f
    const r =
        f > 0.5 - e && f < 0.5 + e ? (i % 2 == 0 ? i : i + 1) : Math.round(n);

    return d ? r / m : r;
}
