import { Client as BlackdogConfiguratorClient } from '@umerx/umerx-blackdog-configurator-client-typescript';
import { AlpacaClient, AlpacaStream } from '@umerx/alpaca';

const alpacaClientCredentialsKey =
    process.env.ALPACA_CLIENT_CREDENTIALS_KEY ?? '';
const alpacaClientCredentialsSecret =
    process.env.ALPACA_CLIENT_CREDENTIALS_SECRET ?? '';

const blackdogBlackdogConfiguratorClientScheme =
    process.env.BLACKDOG_CONFIGURATOR_CLIENT_SCHEME ?? '';
const blackdogBlackdogConfiguratorClientHost =
    process.env.BLACKDOG_CONFIGURATOR_CLIENT_HOST ?? '';
const blackdogBlackdogConfiguratorClientPort =
    process.env.BLACKDOG_CONFIGURATOR_CLIENT_PORT ?? '';
const blackdogBlackdogConfiguratorClientPath =
    process.env.BLACKDOG_CONFIGURATOR_CLIENT_PATH ?? '';
const blackdogBlackdogConfiguratorClientBaseUrl = `${blackdogBlackdogConfiguratorClientScheme}://${blackdogBlackdogConfiguratorClientHost}${
    undefined === blackdogBlackdogConfiguratorClientPort
        ? ''
        : `:${blackdogBlackdogConfiguratorClientPort}`
}${blackdogBlackdogConfiguratorClientPath}`;

const alpacaClient = new AlpacaClient({
    credentials: {
        key: alpacaClientCredentialsKey,
        secret: alpacaClientCredentialsSecret,
    },
    rate_limit: true,
});

const blackdogBlackdogConfiguratorClient =
    new BlackdogConfiguratorClient.ClientImpl(
        blackdogBlackdogConfiguratorClientBaseUrl
    );

const account = await alpacaClient.getAccount();

console.log(JSON.stringify(account, null, 2));
const symbols = await blackdogBlackdogConfiguratorClient.symbol().getMany({});
console.log(JSON.stringify(symbols, null, 2));
