import { Client as BlackdogConfiguratorClient } from '@umerx/umerx-blackdog-configurator-client-typescript';
import {
    getBlackdogConfiguratorClient,
    getBlackdogConfiguratorClientStrategyLogPostMany,
} from '../../clients/blackdogConfigurator.js';
import { StrategyTemplateSeaDogDiscountScheme as StrategyTemplateSeaDogDiscountSchemeTypes } from '@umerx/umerx-blackdog-configurator-types-typescript';
import { StrategyLogger } from '../../types/index.js';
import { getAlpacaClient, getStockBars } from '../../clients/alpaca.js';
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
        valueStrategyTemplateSeaDogDiscountScheme(
            strategyTemplateSeaDogDiscountScheme,
            blackdogConfiguratorClient,
            strategyLogger
        )
            .then(() => {
                return strategyLogger('Valuation was successful', 'info');
            })
            .catch((err) => {
                strategyLogger(
                    'There was an unexpected error while valuating this strategy',
                    'notice',
                    { rawData: err }
                );
                handleFailedValueStrategyTemplateSeaDogDiscountScheme(err);
            })
            .finally(() => {
                return strategyLogger('Concluded valuation', 'debug');
            });
    }
} catch (err) {
    handleFailedBatch(err);
}

function handleFailedBatch(err: any) {
    console.error(err);
}

function batchLog(message: string) {
    console.log(
        `${new Date()}: strategyTemplateSeaDogDiscountScheme: ${message}`
    );
}

function handleFailedValueStrategyTemplateSeaDogDiscountScheme(err: any) {
    console.error(err);
}

async function valueStrategyTemplateSeaDogDiscountScheme(
    strategyTemplateSeaDogDiscountScheme: StrategyTemplateSeaDogDiscountSchemeTypes.StrategyTemplateSeaDogDiscountSchemeResponseBodyDataInstance,
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client,
    strategyLogger: StrategyLogger
) {
    await strategyLogger('Valuation started', 'debug');
    const end = new Date();
    // Alpaca API error if you try to query for recent data: subscription does not permit querying recent SIP data. Subtract 30 minutes
    end.setTime(end.getTime() - 30 * 60 * 1000);
    const start = new Date(end);
    start.setDate(
        end.getDate() - strategyTemplateSeaDogDiscountScheme.timeframeInDays
    ); // - Fetch the strategy's assets endpoint data
    let totalAssetsValueInCents = 0;
    await strategyLogger('Fetching strategy assets', 'debug');
    const strategyAssets = await blackdogConfiguratorClient
        .strategy()
        .getAssetsSingle({
            id: strategyTemplateSeaDogDiscountScheme.strategyId,
        });
    await strategyLogger('Fetched strategy assets', 'debug', {
        rawData: {
            strategyAssets,
        },
    });
    totalAssetsValueInCents = bankersRoundingTruncateToInt(
        totalAssetsValueInCents + strategyAssets.data.cashInCents
    );
    totalAssetsValueInCents = bankersRoundingTruncateToInt(
        totalAssetsValueInCents + strategyAssets.data.openOrdersValueInCents
    );
    await strategyLogger(
        `Strategy total assets value in cents minus holdings is ${totalAssetsValueInCents}`,
        'debug'
    );
    if (strategyAssets.data.positions.length > 0) {
        // - Get the currently active template instance
        //     - Access API keys
        await strategyLogger('Fetching symbols for positions', 'debug');
        const symbols = await blackdogConfiguratorClient.symbol().getMany({
            ids: strategyAssets.data.positions.map((position) => position.symbolId),
        });
        await strategyLogger('Fethed symbols for positions', 'debug', {
            rawData: {
                start,
                end,
                symbols,
            },
        });
        const alpacaClient = getAlpacaClient({
            key: strategyTemplateSeaDogDiscountScheme.alpacaAPIKey,
            secret: strategyTemplateSeaDogDiscountScheme.alpacaAPISecret,
            paper: strategyTemplateSeaDogDiscountScheme.alpacaAPIPaper,
        });
        await strategyLogger('Fetching stockbars for timeframe', 'debug', {
            rawData: {
                start,
                end,
                symbols,
            },
        });
        const stockBars = await getStockBars(
            symbols.data.map((symbol) => symbol.name),
            start,
            end,
            '1Day',
            alpacaClient
        );
        await strategyLogger('Fetched stockbars', 'debug');
        // - For each Holding, use the API keys to fetch current market value
        // - Sum up the current market values
        await strategyLogger('Calculating total assets value', 'debug');
        for (const position of strategyAssets.data.positions) {
            await strategyLogger(
                `Getting data for position with id ${position.id}`,
                'debug',
                {
                    rawData: {
                        position,
                    },
                }
            );
            const symbol = symbols.data.find(
                (symbol) => symbol.id === position.symbolId
            );
            if (symbol === undefined) {
                await strategyLogger(
                    `Unable to find symbol for position with id ${position.id} and symbolId ${position.symbolId}`,
                    'notice',
                    {
                        rawData: {
                            position,
                            symbols,
                        },
                    }
                );
                continue;
            }
            const bars = stockBars.bars[symbol.name];
            if (bars === undefined) {
                await strategyLogger(
                    `Unable to find bars for symbol with name ${symbol.name}`,
                    'notice',
                    {
                        rawData: {
                            symbol,
                            stockBars,
                        },
                    }
                );
                continue;
            }
            if (bars.length < 1) {
                await strategyLogger(
                    `No bars found for symbol with name ${symbol.name}`,
                    'notice',
                    {
                        rawData: {
                            symbol,
                            bars,
                        },
                    }
                );
                continue;
            }
            const mostRecentBar = bars[bars.length - 1];
            await strategyLogger(`Most recent bar`, 'debug', {
                rawData: {
                    mostRecentBar,
                },
            });
            const positionValueInCents = bankersRoundingTruncateToInt(
                position.quantity *
                    bankersRoundingTruncateToInt(mostRecentBar.vw * 100)
            );
            await strategyLogger(
                `Position value in cents: ${positionValueInCents}.`,
                'debug'
            );
            totalAssetsValueInCents = bankersRoundingTruncateToInt(
                totalAssetsValueInCents + positionValueInCents
            );
            await strategyLogger(
                `Total assets value in cents is now ${totalAssetsValueInCents}`,
                'debug'
            );
        }
    }
    await strategyLogger(
        `Updating strategy total assets value in cents to ${totalAssetsValueInCents}`,
        'debug'
    );
    // - Call the endpoint to update a database table with the results to cache them
    await blackdogConfiguratorClient.strategyValue().postMany([
        {
            strategyId: strategyTemplateSeaDogDiscountScheme.strategyId,
            valueInCents: totalAssetsValueInCents,
        },
    ]);
    await strategyLogger('Updated strategy value', 'debug');
}
