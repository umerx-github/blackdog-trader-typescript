import { Client as BlackdogConfiguratorClient } from '@umerx/umerx-blackdog-configurator-client-typescript';

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
