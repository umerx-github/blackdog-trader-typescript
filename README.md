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
-   [ ] Add logic for resolveSymbol (maybe purchase)
    -   [ ] Sort the symbols by highest price first, lowest price last
    -   [ ] Identify the cheapest symbol
    -   [ ] While cash is greater than price of cheapest symbol
        -   [ ] Set variable priceIndex to track index of most exensive yet affordable symbol
        -   [ ] Loop through i = priceIndex > 0 ? priceIndex : 0 to symbols.length
            -   [ ] if cash < symbols[i].priceInCents
                -   [ ] priceIndex = i + 1
                -   [ ] continue
            -   [ ] If symbols[i].shouldBuy
                -   [ ] Purchase symbols[i]
-   [ ] Encapsulate the symbols, positions, stockbars data etc needed for selling and purchasing into a data provider(s)
