import { Client as BlackdogConfiguratorClient } from '@umerx/umerx-blackdog-configurator-client-typescript';
import {
    AlpacaClient,
    AlpacaStream,
    BarsV1Timeframe,
    Bar_v2,
} from '@umerx/alpaca';
import {
    StrategyTemplateSeaDogDiscountScheme as StrategyTemplateSeaDogDiscountSchemeTypes,
    Order as OrderTypes,
    Position as PositionTypes,
    Symbol as SymbolTypes,
} from '@umerx/umerx-blackdog-configurator-types-typescript';

try {
    const blackdogConfiguratorClientScheme =
        process.env.BLACKDOG_CONFIGURATOR_CLIENT_SCHEME ?? '';
    const blackdogConfiguratorClientHost =
        process.env.BLACKDOG_CONFIGURATOR_CLIENT_HOST ?? '';
    const blackdogConfiguratorClientPort =
        process.env.BLACKDOG_CONFIGURATOR_CLIENT_PORT ?? '';
    const blackdogConfiguratorClientPath =
        process.env.BLACKDOG_CONFIGURATOR_CLIENT_PATH ?? '';
    const blackdogConfiguratorClientBaseUrl = `${blackdogConfiguratorClientScheme}://${blackdogConfiguratorClientHost}${
        '' === blackdogConfiguratorClientPort
            ? ''
            : `:${blackdogConfiguratorClientPort}`
    }${blackdogConfiguratorClientPath}`;

    const blackdogConfiguratorClient: BlackdogConfiguratorClient.Client =
        new BlackdogConfiguratorClient.ClientImpl(
            blackdogConfiguratorClientBaseUrl
        );

    const responseStrategyTemplateSeaDogDiscountSchemeActive =
        await blackdogConfiguratorClient
            .strategyTemplateSeaDogDiscountScheme()
            .getMany({ status: 'active' });
    for (const strategyTemplateSeaDogDiscountScheme of responseStrategyTemplateSeaDogDiscountSchemeActive) {
        executeStrategyTemplateSeaDogDiscountScheme(
            strategyTemplateSeaDogDiscountScheme,
            blackdogConfiguratorClient
        ).catch((err) => {
            handleFailedExecuteStrategyTemplateSeaDogDiscountScheme(
                strategyTemplateSeaDogDiscountScheme,
                err
            );
        });
    }
} catch (err) {
    console.error(err);
}

function handleFailedExecuteStrategyTemplateSeaDogDiscountScheme(
    strategyTemplateSeaDogDiscountScheme: StrategyTemplateSeaDogDiscountSchemeTypes.StrategyTemplateSeaDogDiscountSchemeResponseBodyDataInstance,
    err: any
) {
    console.error(err);
}

function handleFailedResolveOpenOrders(err: any) {
    console.error(err);
}

function handleFailedResolveOpenOrder(err: any) {
    console.error(err);
}

function handleFailedResolveOpenPositions(err: any) {
    console.error(err);
}

function handleFailedResolveOpenPosition(err: any) {
    console.error(err);
}

async function executeStrategyTemplateSeaDogDiscountScheme(
    strategyTemplateSeaDogDiscountScheme: StrategyTemplateSeaDogDiscountSchemeTypes.StrategyTemplateSeaDogDiscountSchemeResponseBodyDataInstance,
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client
) {
    const end = new Date();
    // Alpaca API error if you try to query for recent data: subscription does not permit querying recent SIP data. Subtract 30 minutes
    end.setTime(end.getTime() - 30 * 60 * 1000);
    const start = new Date(end);
    start.setDate(
        end.getDate() - strategyTemplateSeaDogDiscountScheme.timeframeInDays
    );
    const alpacaClient = new AlpacaClient({
        credentials: {
            key: Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
                ? process.env.ALPACA_API_KEY ?? ''
                : strategyTemplateSeaDogDiscountScheme.alpacaAPIKey,
            secret: Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
                ? process.env.ALPACA_API_SECRET ?? ''
                : strategyTemplateSeaDogDiscountScheme.alpacaAPISecret,
            paper: Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
                ? Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
                : strategyTemplateSeaDogDiscountScheme.alpacaAPIPaper,
        },
        rate_limit: true,
    });
    const account = await alpacaClient.getAccount();
    const strategy = await blackdogConfiguratorClient.strategy().getSingle({
        id: strategyTemplateSeaDogDiscountScheme.strategyId,
    });
    const accountCashInCents = bankersRounding(account.cash * 100);
    if (strategy.cashInCents > accountCashInCents) {
        throw new Error(
            `Strategy cashInCents is greater than account cashInCents. Strategy: ${strategy.cashInCents}, Account: ${accountCashInCents}`
        );
    }
    try {
        await resolveOpenOrders(
            alpacaClient,
            blackdogConfiguratorClient,
            strategyTemplateSeaDogDiscountScheme
        );
    } catch (err) {
        handleFailedResolveOpenOrders(err);
    }
    const openPositions = await blackdogConfiguratorClient.position().getMany({
        strategyId: strategyTemplateSeaDogDiscountScheme.strategyId,
    });
    // union/distinct
    const symbolIds = Array.from(
        new Set([
            ...strategyTemplateSeaDogDiscountScheme.symbolIds,
            ...openPositions.map((position) => position.symbolId),
        ]).values()
    );
    const symbols = await blackdogConfiguratorClient.symbol().getMany({
        ids: symbolIds,
    });
    const stockbars = await getStockBars(
        symbols.map((symbol) => symbol.name),
        start,
        end,
        '1Day',
        alpacaClient
    );

    try {
        await resolveOpenPositions(
            openPositions,
            symbols,
            strategyTemplateSeaDogDiscountScheme,
            stockbars,
            alpacaClient,
            blackdogConfiguratorClient
        );
    } catch (err) {
        handleFailedResolveOpenPositions(err);
    }
}

async function getStockBars(
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

async function resolveOpenOrders(
    alpacaClient: AlpacaClient,
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client,
    strategyTemplateSeaDogDiscountScheme: StrategyTemplateSeaDogDiscountSchemeTypes.StrategyTemplateSeaDogDiscountSchemeResponseBodyDataInstance
) {
    const openOrders = await blackdogConfiguratorClient.order().getMany({
        strategyId: strategyTemplateSeaDogDiscountScheme.strategyId,
        status: 'open',
    });
    for (const openOrder of openOrders) {
        try {
            await resolveOpenOrder(
                openOrder,
                alpacaClient,
                blackdogConfiguratorClient
            );
        } catch (err) {
            handleFailedResolveOpenOrder(err);
        }
    }
}
async function resolveOpenOrder(
    order: OrderTypes.OrderResponseBodyDataInstance,
    alpacaClient: AlpacaClient,
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client
) {
    try {
        const alpacaOrder = await alpacaClient.getOrder({
            order_id: order.alpacaOrderId,
        });
        if (alpacaOrder.status === 'filled') {
            blackdogConfiguratorClient.order().fillSingle({
                id: order.id,
            });
        } else {
            await alpacaClient.cancelOrder({
                order_id: order.alpacaOrderId,
            });
            await blackdogConfiguratorClient.order().cancelSingle({
                id: order.id,
            });
        }
    } catch (err: any) {
        // Order not found
        if (
            err !== null &&
            typeof err === 'object' &&
            err.hasOwnProperty('code') &&
            err.code === 40010001
        ) {
            blackdogConfiguratorClient.order().cancelSingle({
                id: order.id,
            });
        }
    }
}

async function resolveOpenPositions(
    openPositions: PositionTypes.PositionResponseBodyDataInstance[],
    symbols: SymbolTypes.SymbolResponseBodyDataInstance[],
    strategyTemplateSeaDogDiscountScheme: StrategyTemplateSeaDogDiscountSchemeTypes.StrategyTemplateSeaDogDiscountSchemeResponseBodyDataInstance,
    stockbars: {
        bars: {
            [symbol: string]: Bar_v2[];
        };
        next_page_token: string | null;
    },
    alpacaClient: AlpacaClient,
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client
) {
    for (const openPosition of openPositions) {
        try {
            const symbol = symbols.find(
                (symbol) => symbol.id === openPosition.symbolId
            );
            if (symbol === undefined) {
                continue;
            }
            const bars = stockbars.bars[symbol.name];
            if (bars === undefined) {
                continue;
            }
            await resolveOpenPosition(
                openPosition,
                symbol,
                strategyTemplateSeaDogDiscountScheme,
                bars,
                alpacaClient,
                blackdogConfiguratorClient
            );
        } catch (err) {
            handleFailedResolveOpenPosition(err);
        }
    }
}

async function resolveOpenPosition(
    position: PositionTypes.PositionResponseBodyDataInstance,
    symbol: SymbolTypes.SymbolResponseBodyDataInstance,
    strategyTemplateSeaDogDiscountScheme: StrategyTemplateSeaDogDiscountSchemeTypes.StrategyTemplateSeaDogDiscountSchemeResponseBodyDataInstance,
    bars: Bar_v2[],
    alpacaClient: AlpacaClient,
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client
) {
    const alpacaPosition = await alpacaClient.getPosition({
        symbol: symbol.name,
    });
    if (position.quantity > alpacaPosition.qty) {
        throw new Error(
            `Position quantity is greater than Alpaca position quantity. Symbol: ${symbol.name}, Position: ${position.quantity}, Alpaca: ${alpacaPosition.qty}`
        );
    }
    // Get the last bar
    const mostRecentBar = bars[bars.length - 1];
    // Identify how many bars have a price that is lower or equal to the last bar
    const numberOfBarsWithLowerOrEqualPrice = bars.filter(
        (bar) => bar.vw <= mostRecentBar.vw
    ).length;
    const mostRecentBarPercentile =
        (numberOfBarsWithLowerOrEqualPrice / bars.length) * 100;
    const gainPercentage = (bankersRounding(mostRecentBar.vw * 100) / position.averagePriceInCents) * 100;
    if (
        mostRecentBarPercentile >
        strategyTemplateSeaDogDiscountScheme.sellAtPercentile && gainPercentage >= strategyTemplateSeaDogDiscountScheme.minimumGainPercent
    ) {
        // Sell
        const order = await alpacaClient.placeOrder({
            symbol: symbol.name,
            qty: position.quantity,
            side: 'sell',
            type: 'limit',
            time_in_force: 'day',
            extended_hours: true,
            limit_price: mostRecentBar.vw,
        });
        await blackdogConfiguratorClient.order().postMany([
            {
                strategyId: position.strategyId,
                symbolId: position.symbolId,
                alpacaOrderId: order.id,
                quantity: position.quantity,
                side: 'sell',
                averagePriceInCents: bankersRounding(mostRecentBar.vw * 100),
            },
        ]);
    }
}

function bankersRounding(num: number, decimalPlaces: number = 2): number {
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

/*
def round_float_to_nearest_cent(amount: float):
    # Convert the amount to a Decimal object with two decimal places
    decimal_amount = decimal.Decimal(str(amount)).quantize(
        decimal.Decimal('.01'), rounding=decimal.ROUND_HALF_EVEN)
    # Convert the Decimal object back to a float
    return float(decimal_amount)


def currency_float_to_int(value: float):
    # Use banker's rounding
    return round(value * 100)


def currency_int_to_float(value: int):
    return value / 100


def currency_percent_of(percent: float, of: int):
    return round(round(percent * of) / 100)  # ALSO WORKS
    # return round((percent / 100) * of)  # WORKS
*/
