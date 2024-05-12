import { Client as BlackdogConfiguratorClient } from '@umerx/umerx-blackdog-configurator-client-typescript';
import { AlpacaClient, BarsV1Timeframe, Bar_v2, Order } from '@umerx/alpaca';
import {
    Response as ResponseTypes,
    Log as LogTypes,
    Strategy as StrategyTypes,
    StrategyLog as StrategyLogTypes,
    StrategyTemplateSeaDogDiscountScheme as StrategyTemplateSeaDogDiscountSchemeTypes,
    Order as OrderTypes,
    Position as PositionTypes,
    Symbol as SymbolTypes,
} from '@umerx/umerx-blackdog-configurator-types-typescript';
import { StrategyLogger } from '../../types/index.js';
import {
    getAlpacaClient,
    getStockBars,
    purchaseSymbol,
} from '../../clients/alpaca.js';
import {
    addOrderToConfigurator,
    getBlackdogConfiguratorClient,
    getBlackdogConfiguratorClientStrategyLogPostMany,
} from '../../clients/blackdogConfigurator.js';
import { bankersRoundingTruncateToInt } from '../../utils/index.js';

try {
    batchLog('Start');

    const blackdogConfiguratorClient = getBlackdogConfiguratorClient();

    batchLog('Getting active strategyTemplateSeaDogDiscountScheme');
    const { data: responseStrategyTemplateSeaDogDiscountSchemeActive } =
        await blackdogConfiguratorClient
            .strategyTemplateSeaDogDiscountScheme()
            .getMany({ status: 'active' });
    batchLog(
        `Got active strategyTemplateSeaDogDiscountScheme: Count: ${responseStrategyTemplateSeaDogDiscountSchemeActive.length}`
    );
    for (const strategyTemplateSeaDogDiscountScheme of responseStrategyTemplateSeaDogDiscountSchemeActive) {
        const strategyLogger = getBlackdogConfiguratorClientStrategyLogPostMany(
            blackdogConfiguratorClient,
            strategyTemplateSeaDogDiscountScheme.strategyId
        );
        executeStrategyTemplateSeaDogDiscountScheme(
            strategyTemplateSeaDogDiscountScheme,
            blackdogConfiguratorClient,
            strategyLogger
        )
            .then(() => {
                return strategyLogger('Execution was successful', 'info');
            })
            .catch((err) => {
                strategyLogger(
                    'There was an unexpected error while executing this strategy',
                    'notice',
                    { rawData: err }
                );
                handleFailedExecuteStrategyTemplateSeaDogDiscountScheme(err);
            })
            .finally(() => {
                return strategyLogger('Concluded execution', 'debug');
            });
    }
} catch (err) {
    handleFailedBatch(err);
}

function handleFailedBatch(err: any) {
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

function handleFailedResolveOpenSymbols(err: any) {
    console.error(err);
}

function handleFailedResolveOpenSymbol(err: any) {
    console.error(err);
}

function batchLog(message: string) {
    console.log(
        `${new Date()}: strategyTemplateSeaDogDiscountScheme: ${message}`
    );
}

function handleFailedExecuteStrategyTemplateSeaDogDiscountScheme(err: any) {
    console.error(err);
}

function handleUnableToCalculatePercentileForBar(err: any) {
    console.error(err);
}

async function executeStrategyTemplateSeaDogDiscountScheme(
    strategyTemplateSeaDogDiscountScheme: StrategyTemplateSeaDogDiscountSchemeTypes.StrategyTemplateSeaDogDiscountSchemeResponseBodyDataInstance,
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client,
    strategyLogger: StrategyLogger
) {
    const end = new Date();
    // Alpaca API error if you try to query for recent data: subscription does not permit querying recent SIP data. Subtract 30 minutes
    end.setTime(end.getTime() - 30 * 60 * 1000);
    const start = new Date(end);
    start.setDate(
        end.getDate() - strategyTemplateSeaDogDiscountScheme.timeframeInDays
    );
    const alpacaClient = getAlpacaClient({
        key: strategyTemplateSeaDogDiscountScheme.alpacaAPIKey,
        secret: strategyTemplateSeaDogDiscountScheme.alpacaAPISecret,
        paper: strategyTemplateSeaDogDiscountScheme.alpacaAPIPaper,
    });
    await strategyLogger(`Started a new execution`, 'info');
    const account = await alpacaClient.getAccount();
    await strategyLogger(`Retrieved Alpaca account information`, 'debug', {
        rawData: account,
    });
    await strategyLogger(`Getting Blackdog strategy information`, 'debug');
    let { data: strategy } = await blackdogConfiguratorClient
        .strategy()
        .getSingle({
            id: strategyTemplateSeaDogDiscountScheme.strategyId,
        });
    await strategyLogger(`Retrieved Blackdog strategy information`, 'debug', {
        rawData: strategy,
    });
    await strategyLogger(
        `Checking if strategy cashInCents is greater than account cashInCents`,
        'debug'
    );
    const accountCashInCents = bankersRoundingTruncateToInt(account.cash * 100);
    await strategyLogger(
        `Strategy cash in cents: ${strategy.cashInCents}, Account cash in cents: ${accountCashInCents}`,
        'debug'
    );
    if (strategy.cashInCents > accountCashInCents) {
        throw new Error(
            `Strategy cashInCents is greater than account cashInCents. Strategy: ${strategy.cashInCents}, Account: ${accountCashInCents}`
        );
    }
    await strategyLogger(
        `Strategy cashInCents is less than account cashInCents - continuing`,
        'debug'
    );
    try {
        await strategyLogger('Resolving open orders', 'debug');
        await resolveOpenOrders(
            alpacaClient,
            blackdogConfiguratorClient,
            strategyTemplateSeaDogDiscountScheme,
            strategyLogger
        );
        await strategyLogger('Resolved open orders', 'debug');
    } catch (err) {
        await strategyLogger('Failed to resolve open orders', 'notice', {
            rawData: err,
        });
        handleFailedResolveOpenOrders(err);
    }
    await strategyLogger('Getting open positions', 'debug');
    const { data: openPositions } = await blackdogConfiguratorClient
        .position()
        .getMany({
            strategyId: strategyTemplateSeaDogDiscountScheme.strategyId,
        });
    await strategyLogger(
        `Retrieved ${openPositions.length} open positions`,
        'debug'
    );
    // union/distinct
    await strategyLogger('Finding unique symbolIds', 'debug');
    const symbolIds = Array.from(
        new Set([
            ...strategyTemplateSeaDogDiscountScheme.symbolIds,
            ...openPositions.map((position) => position.symbolId),
        ]).values()
    );
    strategyLogger(`Unique symbols found`, 'debug', { rawData: symbolIds });
    await strategyLogger('Getting symbols', 'debug');
    const { data: symbols } = await blackdogConfiguratorClient
        .symbol()
        .getMany({
            ids: symbolIds,
        });
    await strategyLogger(`Retrieved symbols`, 'debug', { rawData: symbols });
    strategyLogger(`Getting bars for symbols`, 'debug');
    const stockbars = await getStockBars(
        symbols.map((symbol) => symbol.name),
        start,
        end,
        '1Day',
        alpacaClient
    );
    await strategyLogger(`Retrieved bars for symbols`, 'debug');
    try {
        await strategyLogger('Resolving open positions', 'debug', {
            rawData: openPositions,
        });
        await resolveOpenPositions(
            openPositions,
            symbols,
            strategyTemplateSeaDogDiscountScheme,
            stockbars,
            alpacaClient,
            blackdogConfiguratorClient
        );
        await strategyLogger('Resolved open positions', 'debug');
    } catch (err) {
        await strategyLogger('Failed to resolve open positions', 'notice', {
            rawData: err,
        });
        handleFailedResolveOpenPositions(err);
    }

    // Refresh the strategy
    await strategyLogger('Refreshing strategy', 'debug', {
        rawData: strategy,
    });
    ({ data: strategy } = await blackdogConfiguratorClient
        .strategy()
        .getSingle({
            id: strategyTemplateSeaDogDiscountScheme.strategyId,
        }));
    await strategyLogger('Refreshed strategy', 'debug', {
        rawData: strategy,
    });
    try {
        strategyLogger(`Resolving open symbols`, 'debug', {
            rawData: symbols,
        });
        await resolveOpenSymbols(
            strategy,
            symbols,
            strategyTemplateSeaDogDiscountScheme,
            stockbars,
            alpacaClient,
            blackdogConfiguratorClient,
            strategyLogger
        );
        await strategyLogger('Resolved open symbols', 'debug');
    } catch (err) {
        await strategyLogger('Failed to resolve open symbols', 'notice', {
            rawData: err,
        });
        handleFailedResolveOpenSymbols(err);
    }
}

async function resolveOpenOrders(
    alpacaClient: AlpacaClient,
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client,
    strategyTemplateSeaDogDiscountScheme: StrategyTemplateSeaDogDiscountSchemeTypes.StrategyTemplateSeaDogDiscountSchemeResponseBodyDataInstance,
    strategyLogger: StrategyLogger
) {
    const { data: openOrders } = await blackdogConfiguratorClient
        .order()
        .getMany({
            strategyId: strategyTemplateSeaDogDiscountScheme.strategyId,
            status: 'open',
        });
    for (const openOrder of openOrders) {
        try {
            await resolveOpenOrder(
                openOrder,
                alpacaClient,
                blackdogConfiguratorClient,
                strategyLogger
            );
        } catch (err) {
            strategyLogger('Failed to resolve open order', 'notice', {
                rawData: err,
            });
            handleFailedResolveOpenOrder(err);
        }
    }
}
async function resolveOpenOrder(
    order: OrderTypes.OrderResponseBodyDataInstance,
    alpacaClient: AlpacaClient,
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client,
    strategyLogger: StrategyLogger
) {
    try {
        await strategyLogger(
            `Resolving open order with id ${order.id} and Alpaca id ${order.alpacaOrderId}`,
            'debug',
            {
                rawData: order,
            }
        );
        await strategyLogger(
            `Getting Alpaca order with id ${order.alpacaOrderId}`,
            'debug'
        );
        const alpacaOrder = await alpacaClient.getOrder({
            order_id: order.alpacaOrderId,
        });
        await strategyLogger(
            `Got Alpaca order with id ${order.alpacaOrderId}`,
            'debug',
            {
                rawData: alpacaOrder,
            }
        );
        await strategyLogger(
            `Checking if Alpaca order status is filled`,
            'debug'
        );
        if (alpacaOrder.status === 'filled') {
            await strategyLogger(
                `Alpaca order status is filled. Filling Blackdog order`,
                'debug'
            );
            await blackdogConfiguratorClient.order().fillSingle({
                id: order.id,
            });
            await strategyLogger(
                `Filled Blackdog order with id ${order.id}`,
                'debug'
            );
        } else {
            await strategyLogger(
                `Alpaca order status is not filled. Cancelling order`,
                'debug'
            );
            await strategyLogger(
                `Cancelling Alpaca order with id ${order.alpacaOrderId}`,
                'debug'
            );
            await alpacaClient.cancelOrder({
                order_id: order.alpacaOrderId,
            });
            await strategyLogger(
                `Cancelled Alpaca order with id ${order.alpacaOrderId}`,
                'debug'
            );
            await strategyLogger(
                `Cancelling Blackdog order with id ${order.id}`,
                'debug'
            );
            await blackdogConfiguratorClient.order().cancelSingle({
                id: order.id,
            });
            await strategyLogger(
                `Cancelled Blackdog order with id ${order.id}`,
                'debug'
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
            await strategyLogger(
                `Order with id ${order.id} and Alpaca id ${order.alpacaOrderId} was not found. Cancelling order`,
                'notice',
                {
                    rawData: order,
                }
            );
            await blackdogConfiguratorClient.order().cancelSingle({
                id: order.id,
            });
            await strategyLogger(
                `Order with id ${order.id} and Alpaca id ${order.alpacaOrderId} was cancelled`,
                'notice'
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
    strategy: StrategyTypes.StrategyResponseBodyDataInstance,
    symbols: SymbolTypes.SymbolResponseBodyDataInstance[],
    strategyTemplateSeaDogDiscountScheme: StrategyTemplateSeaDogDiscountSchemeTypes.StrategyTemplateSeaDogDiscountSchemeResponseBodyDataInstance,
    stockbars: {
        bars: {
            [symbol: string]: Bar_v2[];
        };
        next_page_token: string | null;
    },
    alpacaClient: AlpacaClient,
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client,
    strategyLogger: StrategyLogger
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
                await strategyLogger(
                    `Symbol ${symbol.name} is in the buy percentile. BuyAtPercentile: ${strategyTemplateSeaDogDiscountScheme.buyAtPercentile}. Percentile: ${mostRecentBarPercentile}`,
                    'debug'
                );
                stockbarsForSymbols.push({
                    symbol: symbol,
                    bars: bars,
                });
            } else {
                await strategyLogger(
                    `Symbol ${symbol.name} is not in the buy percentile. BuyAtPercentile: ${strategyTemplateSeaDogDiscountScheme.buyAtPercentile}. Percentile: ${mostRecentBarPercentile}`,
                    'debug'
                );
            }
        } catch (err) {
            await strategyLogger(
                `Failed to calculate percentile for symbol: ${symbol.name}`,
                'notice',
                { rawData: err }
            );
            handleUnableToCalculatePercentileForBar(err);
        }
    }
    if (stockbarsForSymbols.length === 0) {
        await strategyLogger(`No symbols are in the buy percentile`, 'debug');
        return;
    }
    stockbarsForSymbols.sort((a, b) => {
        const aLastBar = a.bars[a.bars.length - 1];
        const bLastBar = b.bars[b.bars.length - 1];
        return bLastBar.vw - aLastBar.vw;
    });
    const lowestPriceSymbol =
        stockbarsForSymbols[stockbarsForSymbols.length - 1];
    await strategyLogger(
        `Lowest price symbol: ${lowestPriceSymbol.symbol.name}`,
        'debug'
    );
    const lowestPriceSymbolCashInCents = bankersRoundingTruncateToInt(
        lowestPriceSymbol.bars[lowestPriceSymbol.bars.length - 1].vw * 100
    );
    let accountCashInCents = strategy.cashInCents;
    await strategyLogger(
        `Account cash in cents: ${strategy.cashInCents}, Lowest price symbol cash in cents: ${lowestPriceSymbolCashInCents}`,
        'debug'
    );
    while (accountCashInCents > lowestPriceSymbolCashInCents) {
        await strategyLogger(
            `Account cash in cents is greater than lowest price symbol cash in cents. Account: ${accountCashInCents}, Symbol: ${lowestPriceSymbolCashInCents}`,
            'debug'
        );
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
            await strategyLogger(
                `Account cash in cents: ${accountCashInCents}, Stock current price in cents: ${stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents}`,
                'debug'
            );
            await strategyLogger(
                `Checking if account cash in cents is less than stock current price in cents`,
                'debug'
            );
            if (
                accountCashInCents <
                stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents
            ) {
                await strategyLogger(
                    `Account cash in cents is less than stock current price in cents. Account: ${accountCashInCents}, Stock: ${stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents}`,
                    'debug'
                );
                affordablePriceIndex = i + 1;
                continue;
            }
            try {
                await strategyLogger(
                    `Purchasing symbol: ${stockbarsForSymbol.symbol.name}`,
                    'debug'
                );
                const order = await purchaseSymbol(
                    stockbarsForSymbol.symbol.name,
                    stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents,
                    1,
                    alpacaClient
                );
                await strategyLogger(
                    `Purchased symbol: ${stockbarsForSymbol.symbol.name}`,
                    'debug'
                );
                try {
                    await strategyLogger(
                        'Adding order to configurator',
                        'debug'
                    );
                    await addOrderToConfigurator(
                        strategyTemplateSeaDogDiscountScheme.strategyId,
                        stockbarsForSymbol.symbol.id,
                        order.id,
                        1,
                        stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents,
                        blackdogConfiguratorClient
                    );
                    await strategyLogger(
                        'Added order to configurator',
                        'debug'
                    );
                } catch (err) {
                    try {
                        await strategyLogger(
                            `Failed to add order to configurator. Canceling order: ${order.id}`,
                            'notice'
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
                        await strategyLogger(
                            `Failed to cancle Order. Order: ${
                                order.id
                            }. Decreasing account cash in cents: ${accountCashInCents} - ${stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents} = ${
                                accountCashInCents -
                                stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents
                            }`,
                            'notice',
                            { rawData: { err, order } }
                        );
                        accountCashInCents = bankersRoundingTruncateToInt(
                            accountCashInCents -
                                stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents
                        );
                        throw err;
                    }
                    throw err;
                }
                await strategyLogger(
                    `Decreasing account cash in cents: ${accountCashInCents} - ${stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents} = ${
                        accountCashInCents -
                        stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents
                    }`,
                    'debug'
                );
                accountCashInCents = bankersRoundingTruncateToInt(
                    accountCashInCents -
                        stockbarsForSymbolMostRecentBarVolumeWeightedAveragePriceInCents
                );
            } catch (err) {
                await strategyLogger(
                    `Failed to purchase symbol: ${stockbarsForSymbol.symbol.name}`,
                    'notice',
                    { rawData: err }
                );
                handleFailedResolveOpenSymbol(err);
                continue;
            }
        }
        await strategyLogger(
            `Refreshing strategy to check cash in cents`,
            'debug',
            { rawData: strategy }
        );
        const { data: refreshedStrategy } = await blackdogConfiguratorClient
            .strategy()
            .getSingle({
                id: strategyTemplateSeaDogDiscountScheme.strategyId,
            });
        await strategyLogger(`Refreshed strategy`, 'debug', {
            rawData: refreshedStrategy,
        });
        if (refreshedStrategy.cashInCents < accountCashInCents) {
            throw new Error(
                `Refreshed strategy cashInCents is less than account cashInCents. Strategy: ${refreshedStrategy.cashInCents}, Account: ${accountCashInCents}`
            );
        }
    }
}
