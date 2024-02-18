# umerx-blackdog-configurator-client-typescript

## TODO


-   [ ] Add averagePriceInCents to Position type
-   [ ] Add averagePriceInCents to Position Model
-   [ ] Add averagePriceInCents to Position Migration
-   [ ] Add averagePriceInCents to Position Seed
-   [ ] Add averagePriceInCents to Position Controller
    -   [ ] When creating a new Position with POST /positions and position already exists, set averagePriceInCents to calculate the new average price based on quantity of incoming and existing position
-   [ ] Add averagePriceInCents to Order Controller
    -   [ ] When filling an order, update the averagePriceInCents of the position
-   [X] Add logic for resolveOpenPosition to only sell if also greater than minimumGainPercent
-   [ ] Encapsulate the symbols, positions, stockbars data etc needed for selling and purchasing into a data provider(s)
-   [ ] Add logic for resolveSymbol (maybe purchase)
