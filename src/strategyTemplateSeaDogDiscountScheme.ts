import { Client as BlackdogConfiguratorClient } from '@umerx/umerx-blackdog-configurator-client-typescript';
import {
    AlpacaClient,
    AlpacaStream,
    BarsV1Timeframe,
    Bar_v2,
    Order,
} from '@umerx/alpaca';
import {
    Strategy as StrategyTypes,
    StrategyTemplateSeaDogDiscountScheme as StrategyTemplateSeaDogDiscountSchemeTypes,
    Order as OrderTypes,
    Position as PositionTypes,
    Symbol as SymbolTypes,
} from '@umerx/umerx-blackdog-configurator-types-typescript';

try {
    batchLog('Start');
    const blackDogConfiguratorBackendScheme =
        process.env.BLACKDOG_CONFIGURATOR_BACKEND_SCHEME ?? '';
    const blackDogConfiguratorBackendHost =
        process.env.BLACKDOG_CONFIGURATOR_BACKEND_HOST ?? '';
    const blackDogConfiguratorBackendPort =
        process.env.BLACKDOG_CONFIGURATOR_BACKEND_PORT ?? '';
    const blackDogConfiguratorBackendPath =
        process.env.BLACKDOG_CONFIGURATOR_BACKEND_PATH ?? '';
    const blackDogConfiguratorBackendBaseUrl = `${blackDogConfiguratorBackendScheme}://${blackDogConfiguratorBackendHost}${
        '' === blackDogConfiguratorBackendPort
            ? ''
            : `:${blackDogConfiguratorBackendPort}`
    }${blackDogConfiguratorBackendPath}`;

    const blackdogConfiguratorClient: BlackdogConfiguratorClient.Client =
        new BlackdogConfiguratorClient.ClientImpl(
            blackDogConfiguratorBackendBaseUrl
        );
    batchLog('Getting active strategyTemplateSeaDogDiscountScheme');
    const responseStrategyTemplateSeaDogDiscountSchemeActive =
        await blackdogConfiguratorClient
            .strategyTemplateSeaDogDiscountScheme()
            .getMany({ status: 'active' });
    batchLog(
        `Got active strategyTemplateSeaDogDiscountScheme: Count: ${responseStrategyTemplateSeaDogDiscountSchemeActive.length}`
    );
    for (const strategyTemplateSeaDogDiscountScheme of responseStrategyTemplateSeaDogDiscountSchemeActive) {
        executeStrategyTemplateSeaDogDiscountScheme(
            strategyTemplateSeaDogDiscountScheme,
            blackdogConfiguratorClient
        )
            .then(() => {
                strategyLog(
                    strategyTemplateSeaDogDiscountScheme.strategyId,
                    'Success'
                );
            })
            .catch((err) => {
                handleFailedExecuteStrategyTemplateSeaDogDiscountScheme(
                    strategyTemplateSeaDogDiscountScheme,
                    err
                );
                strategyLog(
                    strategyTemplateSeaDogDiscountScheme.strategyId,
                    'Failed'
                );
            })
            .finally(() => {
                strategyLog(
                    strategyTemplateSeaDogDiscountScheme.strategyId,
                    'End'
                );
            });
    }
} catch (err) {
    handleFailedBatch(err);
}

function handleFailedBatch(err: any) {
    console.error(err);
}

function handleFailedExecuteStrategyTemplateSeaDogDiscountScheme(
    strategyTemplateSeaDogDiscountScheme: StrategyTemplateSeaDogDiscountSchemeTypes.StrategyTemplateSeaDogDiscountSchemeResponseBodyDataInstance,
    err: any
) {
    console.error(
        `${new Date()}: Strategy ${
            strategyTemplateSeaDogDiscountScheme.strategyId
        }: Error: ${err.code} ${err.message}`
    );
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

function handleFailedResolveOpenSymbols(err: any) {
    console.error(err);
}

function handleFailedResolveOpenSymbol(err: any) {
    console.error(err);
}

function strategyLog(strategyId: number, message: string) {
    console.log(`${new Date()}: Strategy ${strategyId}: ${message}`);
}

function batchLog(message: string) {
    console.log(
        `${new Date()}: strategyTemplateSeaDogDiscountScheme: ${message}`
    );
}

function handleUnableToCalculatePercentileForBar(err: any) {
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
    const credentials = {
        key: Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
            ? process.env.ALPACA_API_KEY ?? ''
            : strategyTemplateSeaDogDiscountScheme.alpacaAPIKey,
        secret: Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
            ? process.env.ALPACA_API_SECRET ?? ''
            : strategyTemplateSeaDogDiscountScheme.alpacaAPISecret,
        paper: Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
            ? Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
            : strategyTemplateSeaDogDiscountScheme.alpacaAPIPaper,
    };
    const alpacaClient = new AlpacaClient({
        credentials: credentials,
        rate_limit: true,
    });
    strategyLog(
        strategyTemplateSeaDogDiscountScheme.strategyId,
        `Credentials: ${JSON.stringify(credentials)}`
    );
    strategyLog(
        strategyTemplateSeaDogDiscountScheme.strategyId,
        `Getting account information.`
    );
    const account = await alpacaClient.getAccount();
    strategyLog(
        strategyTemplateSeaDogDiscountScheme.strategyId,
        `Getting strategy information.`
    );
    const strategy = await blackdogConfiguratorClient.strategy().getSingle({
        id: strategyTemplateSeaDogDiscountScheme.strategyId,
    });
    const accountCashInCents = bankersRoundingTruncateToInt(account.cash * 100);
    if (strategy.cashInCents > accountCashInCents) {
        throw new Error(
            `Strategy cashInCents is greater than account cashInCents. Strategy: ${strategy.cashInCents}, Account: ${accountCashInCents}`
        );
    }
    try {
        strategyLog(
            strategyTemplateSeaDogDiscountScheme.strategyId,
            `Resolving open orders.`
        );
        await resolveOpenOrders(
            alpacaClient,
            blackdogConfiguratorClient,
            strategyTemplateSeaDogDiscountScheme
        );
    } catch (err) {
        handleFailedResolveOpenOrders(err);
    }
    strategyLog(
        strategyTemplateSeaDogDiscountScheme.strategyId,
        `Getting open positions.`
    );
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
    strategyLog(
        strategyTemplateSeaDogDiscountScheme.strategyId,
        `Getting symbols.`
    );
    const symbols = await blackdogConfiguratorClient.symbol().getMany({
        ids: symbolIds,
    });
    strategyLog(
        strategyTemplateSeaDogDiscountScheme.strategyId,
        `Getting bars for symbols.`
    );
    const stockbars = await getStockBars(
        symbols.map((symbol) => symbol.name),
        start,
        end,
        '1Day',
        alpacaClient
    );

    try {
        strategyLog(
            strategyTemplateSeaDogDiscountScheme.strategyId,
            `Resolving open positions.`
        );
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

    try {
        strategyLog(
            strategyTemplateSeaDogDiscountScheme.strategyId,
            `Resolving open symbols.`
        );
        await resolveOpenSymbols(
            strategy.cashInCents,
            symbols,
            strategyTemplateSeaDogDiscountScheme,
            stockbars,
            alpacaClient,
            blackdogConfiguratorClient
        );
    } catch (err) {
        handleFailedResolveOpenSymbols(err);
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
        strategyLog(
            order.strategyId,
            `Resolving open order with id ${order.id} and Alpaca id ${order.alpacaOrderId}`
        );
        const alpacaOrder = await alpacaClient.getOrder({
            order_id: order.alpacaOrderId,
        });
        if (alpacaOrder.status === 'filled') {
            blackdogConfiguratorClient.order().fillSingle({
                id: order.id,
            });
            strategyLog(
                order.strategyId,
                `Order with id ${order.id} and Alpaca id ${order.alpacaOrderId} was filled`
            );
        } else {
            await alpacaClient.cancelOrder({
                order_id: order.alpacaOrderId,
            });
            await blackdogConfiguratorClient.order().cancelSingle({
                id: order.id,
            });
            strategyLog(
                order.strategyId,
                `Order with id ${order.id} and Alpaca id ${order.alpacaOrderId} was cancelled`
            );
        }
    } catch (err: any) {
        // Order not found
        if (
            err !== null &&
            typeof err === 'object' &&
            err.hasOwnProperty('code') &&
            err.code === 40010001
        ) {
            strategyLog(
                order.strategyId,
                `Order with id ${order.id} and Alpaca id ${order.alpacaOrderId} was not found. Cancelling order`
            );
            await blackdogConfiguratorClient.order().cancelSingle({
                id: order.id,
            });
            strategyLog(
                order.strategyId,
                `Order with id ${order.id} and Alpaca id ${order.alpacaOrderId} was cancelled`
            );
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
    const mostRecentBarVolumeWeightedAveragePriceInDollars = mostRecentBar.vw;
    const mostRecentBarVolumeWeightedAveragePriceInCents =
        bankersRoundingTruncateToInt(
            mostRecentBarVolumeWeightedAveragePriceInDollars * 100
        );
    const mostRecentBarPercentile =
        (numberOfBarsWithLowerOrEqualPrice / bars.length) * 100;
    const gainPercentage =
        (mostRecentBarVolumeWeightedAveragePriceInCents /
            position.averagePriceInCents) *
        100;
    if (
        mostRecentBarPercentile >
            strategyTemplateSeaDogDiscountScheme.sellAtPercentile &&
        gainPercentage >=
            strategyTemplateSeaDogDiscountScheme.minimumGainPercent
    ) {
        // Sell
        const order = await alpacaClient.placeOrder({
            symbol: symbol.name,
            qty: position.quantity,
            side: 'sell',
            type: 'limit',
            time_in_force: 'day',
            extended_hours: true,
            limit_price: mostRecentBarVolumeWeightedAveragePriceInDollars,
        });
        await blackdogConfiguratorClient.order().postMany([
            {
                strategyId: position.strategyId,
                symbolId: position.symbolId,
                alpacaOrderId: order.id,
                quantity: position.quantity,
                side: 'sell',
                averagePriceInCents:
                    mostRecentBarVolumeWeightedAveragePriceInCents,
            },
        ]);
    }
}

async function resolveOpenSymbols(
    accountCashInCents: number,
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
    // TODO
    const stockbarsForSymbols: {
        symbol: SymbolTypes.SymbolResponseBodyDataInstance;
        bars: Bar_v2[];
    }[] = [];
    for (const symbol of symbols) {
        try {
            const bars = stockbars.bars[symbol.name];
            if (bars === undefined) {
                throw new Error(
                    `Bars not found for symbol: ${symbol.name}, Bars: ${bars}`
                );
            }
            const mostRecentBar = bars[bars.length - 1];
            const numberOfBarsWithLowerOrEqualPrice = bars.filter(
                (bar) => bar.vw <= mostRecentBar.vw
            ).length;
            const mostRecentBarPercentile =
                (numberOfBarsWithLowerOrEqualPrice / bars.length) * 100;
            if (
                mostRecentBarPercentile <=
                strategyTemplateSeaDogDiscountScheme.buyAtPercentile
            ) {
                strategyLog(
                    strategyTemplateSeaDogDiscountScheme.strategyId,
                    `Symbol ${symbol.name} is in the buy percentile. BuyAtPercentile: ${strategyTemplateSeaDogDiscountScheme.buyAtPercentile}. Percentile: ${mostRecentBarPercentile}`
                );
                stockbarsForSymbols.push({
                    symbol: symbol,
                    bars: bars,
                });
            } else {
                strategyLog(
                    strategyTemplateSeaDogDiscountScheme.strategyId,
                    `Symbol ${symbol.name} is not in the buy percentile. BuyAtPercentile: ${strategyTemplateSeaDogDiscountScheme.buyAtPercentile}. Percentile: ${mostRecentBarPercentile}`
                );
            }
        } catch (err) {
            handleUnableToCalculatePercentileForBar(err);
        }
    }
    if (stockbarsForSymbols.length === 0) {
        strategyLog(
            strategyTemplateSeaDogDiscountScheme.strategyId,
            `No symbols are in the buy percentile.`
        );
        return;
    }
    stockbarsForSymbols.sort((a, b) => {
        const aLastBar = a.bars[a.bars.length - 1];
        const bLastBar = b.bars[b.bars.length - 1];
        return bLastBar.vw - aLastBar.vw;
    });
    const lowestPriceSymbol =
        stockbarsForSymbols[stockbarsForSymbols.length - 1];
    strategyLog(
        strategyTemplateSeaDogDiscountScheme.strategyId,
        `Lowest price symbol: ${lowestPriceSymbol.symbol.name}`
    );
    const lowestPriceSymbolCashInCents = bankersRoundingTruncateToInt(
        lowestPriceSymbol.bars[lowestPriceSymbol.bars.length - 1].vw * 100
    );
    strategyLog(
        strategyTemplateSeaDogDiscountScheme.strategyId,
        `Account cash in cents: ${accountCashInCents}, Lowest price symbol cash in cents: ${lowestPriceSymbolCashInCents}`
    );
    while (accountCashInCents > lowestPriceSymbolCashInCents) {
        let affordablePriceIndex = 0;
        for (
            let i = affordablePriceIndex > 0 ? affordablePriceIndex : 0;
            i < stockbarsForSymbols.length;
            i++
        ) {
            const stockbarsForSymbol = stockbarsForSymbols[i];
            const stockbarsForSymbolMostRecentBar =
                stockbarsForSymbol.bars[stockbarsForSymbol.bars.length - 1];
            const stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInDollars =
                stockbarsForSymbolMostRecentBar.vw;
            const stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents =
                bankersRoundingTruncateToInt(
                    stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInDollars *
                        100
                );
            strategyLog(
                strategyTemplateSeaDogDiscountScheme.strategyId,
                `Stock current price in dollars: ${stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInDollars}, Stock current price in cents: ${stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents}`
            );
            strategyLog(
                strategyTemplateSeaDogDiscountScheme.strategyId,
                `Account cash in cents: ${accountCashInCents}, Stock current price in cents: ${stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents}`
            );
            if (
                accountCashInCents <
                stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents
            ) {
                strategyLog(
                    strategyTemplateSeaDogDiscountScheme.strategyId,
                    `Account cash in cents is less than stock current price in cents. Account: ${accountCashInCents}, Stock: ${stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents}`
                );
                affordablePriceIndex = i + 1;
                continue;
            }
            try {
                strategyLog(
                    strategyTemplateSeaDogDiscountScheme.strategyId,
                    `Purchasing symbol: ${stockbarsForSymbol.symbol.name}`
                );
                const order = await purchaseSymbol(
                    stockbarsForSymbol.symbol.name,
                    stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents,
                    1,
                    alpacaClient
                );
                try {
                    strategyLog(
                        strategyTemplateSeaDogDiscountScheme.strategyId,
                        `Adding order to configurator.`
                    );
                    await addOrderToConfigurator(
                        strategyTemplateSeaDogDiscountScheme.strategyId,
                        stockbarsForSymbol.symbol.id,
                        order.id,
                        1,
                        stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents,
                        blackdogConfiguratorClient
                    );
                } catch (err) {
                    try {
                        strategyLog(
                            strategyTemplateSeaDogDiscountScheme.strategyId,
                            `Failed to add order to configurator. Canceling order: ${order.id}`
                        );
                        const canceled = alpacaClient.cancelOrder({
                            order_id: order.id,
                        });
                        if (!canceled) {
                            throw new Error(
                                `Failed to cancel order. Order: ${order.id}`
                            );
                        }
                    } catch (err) {
                        strategyLog(
                            strategyTemplateSeaDogDiscountScheme.strategyId,
                            `Failed to cancel order. Order: ${
                                order.id
                            }. Decreasing account cash in cents: ${accountCashInCents} - ${stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents} = ${
                                accountCashInCents -
                                stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents
                            }`
                        );
                        accountCashInCents = bankersRoundingTruncateToInt(
                            accountCashInCents -
                                stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents
                        );
                        throw err;
                    }
                    throw err;
                }
                strategyLog(
                    strategyTemplateSeaDogDiscountScheme.strategyId,
                    `Decreasing account cash in cents: ${accountCashInCents} - ${stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents} = ${
                        accountCashInCents -
                        stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents
                    }`
                );
                accountCashInCents = bankersRoundingTruncateToInt(
                    accountCashInCents -
                        stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents
                );
            } catch (err) {
                handleFailedResolveOpenSymbol(err);
                continue;
            }
        }
    }
    strategyLog(
        strategyTemplateSeaDogDiscountScheme.strategyId,
        `Updating account cash in cents: ${accountCashInCents}`
    );
    await blackdogConfiguratorClient.strategy().patchSingle(
        { id: strategyTemplateSeaDogDiscountScheme.strategyId },
        {
            cashInCents: accountCashInCents,
        }
    );
}

async function purchaseSymbol(
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

async function addOrderToConfigurator(
    strategyId: number,
    symbolId: number,
    alpacaOrderId: string,
    quantity: number,
    priceInCents: number,
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client
) {
    await blackdogConfiguratorClient.order().postMany([
        {
            strategyId: strategyId,
            symbolId: symbolId,
            alpacaOrderId: alpacaOrderId,
            quantity: quantity,
            side: 'buy',
            averagePriceInCents: priceInCents,
        },
    ]);
}

function bankersRoundingTruncateToInt(num: number): number {
    return bankersRounding(num, 0);
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
