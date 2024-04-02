import {
    Response as ResponseTypes,
    Log as LogTypes,
    StrategyLog as StrategyLogTypes,
} from '@umerx/umerx-blackdog-configurator-types-typescript';

export type StrategyLogger = (
    message: string,
    level: LogTypes.LogLevel,
    data?: LogTypes.LogData
) => Promise<
    ResponseTypes.ResponseBaseSuccess<
        StrategyLogTypes.StrategyLogResponseBodyDataInstance[]
    >
>; // Add return type annotation
