# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# This file is used to define the pairs, timeframes, and strategies
# that you want to backtest/trade.
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from jesse.utils import get_hour_candles_count

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Trading Routes
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
routes = [
    ('Binance Futures', 'BTC-USDT', '4h', 'SampleStrategy'),
    ('Binance Futures', 'ETH-USDT', '4h', 'SampleStrategy'),
    ('Binance Futures', 'BNB-USDT', '4h', 'SampleStrategy'),
    ('Binance Futures', 'LTC-USDT', '4h', 'SampleStrategy'),
]

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Extra Candles
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
extra_candles = [
     ('Binance Futures', 'BTC-USDT', '1h'),
    # ('Binance Futures', 'BTC-USDT', '1h'),
]
