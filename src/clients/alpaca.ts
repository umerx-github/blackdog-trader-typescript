import {
    AlpacaClient,
    BarsV1Timeframe,
    DefaultCredentials,
    Order,
} from '@umerx/alpaca';
import { bankersRounding } from '../utils/index.js';

export function getAlpacaClient(credentials: DefaultCredentials): AlpacaClient {
    return new AlpacaClient({
        credentials: {
            key: Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
                ? process.env.ALPACA_API_KEY ?? ''
                : credentials.key,
            secret: Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
                ? process.env.ALPACA_API_SECRET ?? ''
                : credentials.secret,
            paper: Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
                ? Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
                : credentials.paper,
        },
        rate_limit: true,
    });
}

export async function getStockBars(
    symbolNames: string[],
    start: Date,
    end: Date,
    timeframe: BarsV1Timeframe,
    alpacaClient: AlpacaClient
) {
    /*
    alpacaClient will return data in this shape:
    {
        bars: {
            'AAPL': [],
            'MSFT': [],
        },
        next_page_token: '...',
    }
    We need to request all the pages until next_page_token returns null and merge the data into one object where keys are the symbols and values are the bars.
    */
    const stockbars = await alpacaClient.getBars_v2({
        symbols: symbolNames, // 'AAPL,MSFT',
        start: start,
        end: end,
        timeframe: timeframe,
    });

    while (stockbars.next_page_token !== null) {
        const nextPageStockbars = await alpacaClient.getBars_v2({
            symbols: symbolNames, // 'AAPL,MSFT',
            start: start,
            end: end,
            timeframe: timeframe,
            page_token: stockbars.next_page_token,
        });
        for (const symbol in nextPageStockbars.bars) {
            if (nextPageStockbars.bars.hasOwnProperty(symbol)) {
                stockbars.bars[symbol] = [
                    ...(stockbars.bars[symbol] ?? []),
                    ...nextPageStockbars.bars[symbol],
                ];
            }
        }
        stockbars.next_page_token = nextPageStockbars.next_page_token;
    }
    return stockbars;
}

export async function purchaseSymbol(
    symbolName: string,
    priceInCents: number,
    quantity: number,
    alpacaClient: AlpacaClient
): Promise<Order> {
    return await alpacaClient.placeOrder({
        symbol: symbolName,
        qty: quantity,
        side: 'buy',
        type: 'limit',
        time_in_force: 'day',
        extended_hours: true,
        limit_price: bankersRounding(priceInCents / 100),
    });
}
