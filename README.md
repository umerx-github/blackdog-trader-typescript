# umerx-blackdog-configurator-client-typescript

## TODO

-   [x] Add averagePriceInCents to Position type
-   [x] Add averagePriceInCents to Position Model
-   [x] Add averagePriceInCents to Position Migration
-   [x] Add averagePriceInCents to Position Seed
-   [x] Add averagePriceInCents to Position Controller
    -   [x] When creating a new Position with POST /positions and position already exists, set averagePriceInCents to calculate the new average price based on quantity of incoming and existing position
-   [x] Add averagePriceInCents to Order Controller
    -   [x] When filling an order, update the averagePriceInCents of the position
-   [x] Add logic for resolveOpenPosition to only sell if also greater than minimumGainPercent
-   [x] Add logic for resolveSymbol (maybe purchase)
    -   [x] Sort the symbols by highest price first, lowest price last
    -   [x] Identify the cheapest symbol
    -   [x] While cash is greater than price of cheapest symbol
        -   [x] Set variable priceIndex to track index of most exensive yet affordable symbol
        -   [x] Loop through i = priceIndex > 0 ? priceIndex : 0 to symbols.length
            -   [x] if cash < symbols[i].priceInCents
                -   [x] priceIndex = i + 1
                -   [x] continue
            -   [x] If symbols[i].shouldBuy
                -   [x] Purchase symbols[i]
-   [x] Encapsulate the logic for handling a single symbol into a function
-   [x] Handle error if a single symbol purchase fails (move on)
-   [x] Make sure we are not truncating to 0 decimals until the final calculation where we need cents
-   [x] Use our Strategy's cashInCents instead of alpaca account in Cents as limiting factor
-   [ ] Figure out how to schedule and run the strategy
    -   [ ] Docker image with src installed
    -   [ ] Run image with command for cron
-   [ ] Automatically adjust Strategy cash if it is less than the available cash?
-   [ ] Encapsulate the symbols, positions, stockbars data etc needed for selling and purchasing into a data provider(s)
