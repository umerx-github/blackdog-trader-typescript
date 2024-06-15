import { Client as BlackdogConfiguratorClient } from '@umerx/umerx-blackdog-configurator-client-typescript';
import { StrategyLogger } from '../types/index.js';
import {
    Log as LogTypes,
    Response as ResponseTypes,
    StrategyLog as StrategyLogTypes,
} from '@umerx/umerx-blackdog-configurator-types-typescript';

export function getBlackdogConfiguratorClient() {
    const blackdogConfiguratorBackendScheme =
        process.env.BLACKDOG_CONFIGURATOR_BACKEND_SCHEME ?? '';
    const blackdogConfiguratorBackendHost =
        process.env.BLACKDOG_CONFIGURATOR_BACKEND_HOST ?? '';
    const blackdogConfiguratorBackendPort =
        process.env.BLACKDOG_CONFIGURATOR_BACKEND_PORT ?? '';
    const blackdogConfiguratorBackendPath =
        process.env.BLACKDOG_CONFIGURATOR_BACKEND_PATH ?? '';
    const blackdogConfiguratorBackendBaseUrl = `${blackdogConfiguratorBackendScheme}://${blackdogConfiguratorBackendHost}${
        '' === blackdogConfiguratorBackendPort
            ? ''
            : `:${blackdogConfiguratorBackendPort}`
    }${blackdogConfiguratorBackendPath}`;

    const blackdogConfiguratorClient: BlackdogConfiguratorClient.Client =
        new BlackdogConfiguratorClient.ClientImpl(
            blackdogConfiguratorBackendBaseUrl
        );
    return blackdogConfiguratorClient;
}

export function getBlackdogConfiguratorClientStrategyLogPostMany(
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client,
    strategyId: number
): StrategyLogger {
    return async (
        message: string,
        level: LogTypes.LogLevel,
        data?: LogTypes.LogData
    ): Promise<
        ResponseTypes.ResponseBaseSuccess<
            StrategyLogTypes.StrategyLogResponseBodyDataInstance[]
        >
        > => {
        // console.log(`Strategy ${strategyId}: ${message}`, data);
        return await blackdogConfiguratorClient.strategyLog().postMany([
            {
                strategyId: strategyId,
                message: message,
                level: level,
                data: data,
            },
        ]);
    };
}

export async function addOrderToConfigurator(
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
