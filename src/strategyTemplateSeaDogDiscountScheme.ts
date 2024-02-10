import { Client as BlackdogConfiguratorClient } from '@umerx/umerx-blackdog-configurator-client-typescript';
import { AlpacaClient, AlpacaStream } from '@umerx/alpaca';
import {
    StrategyTemplateSeaDogDiscountScheme as StrategyTemplateSeaDogDiscountSchemeTypes,
    Order as OrderTypes,
} from '@umerx/umerx-blackdog-configurator-types-typescript';
import { copyFileSync } from 'fs';

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

    const blackdogConfiguratorClient =
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
async function executeStrategyTemplateSeaDogDiscountScheme(
    strategyTemplateSeaDogDiscountScheme: StrategyTemplateSeaDogDiscountSchemeTypes.StrategyTemplateSeaDogDiscountSchemeResponseBodyDataInstance,
    blackdogConfiguratorClient: BlackdogConfiguratorClient.Client
) {
    const alpacaClient = new AlpacaClient({
        credentials: {
            key: strategyTemplateSeaDogDiscountScheme.alpacaAPIKey,
            secret: strategyTemplateSeaDogDiscountScheme.alpacaAPISecret,
            paper: strategyTemplateSeaDogDiscountScheme.alpacaAPIPaper,
        },
        rate_limit: true,
    });
    const account = await alpacaClient.getAccount();
    const accountCashInCents = bankersRounding(account.cash * 100);
    let availableCashInCents = strategyTemplateSeaDogDiscountScheme.cashInCents;
    if (accountCashInCents < availableCashInCents) {
        availableCashInCents = accountCashInCents;
    }
    const openOrders = await blackdogConfiguratorClient.order().getMany({
        strategyId: strategyTemplateSeaDogDiscountScheme.strategyId,
    });
    for (const openOrder of openOrders) {
        await resolveOpenOrder(
            openOrder,
            alpacaClient,
            blackdogConfiguratorClient
        );
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

function bankersRounding(num: number, decimalPlaces: number = 2): number {
    var d = decimalPlaces;
    var m = Math.pow(10, d);
    var n = +(d ? num * m : num).toFixed(8); // Avoid rounding errors
    var i = Math.floor(n),
        f = n - i;
    var e = 1e-8; // Allow for rounding errors in f
    var r =
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
