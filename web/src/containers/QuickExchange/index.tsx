import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Button } from 'react-bootstrap';
import { msPricesUpdates } from '../../api';
import { useCurrenciesFetch } from '../../hooks';
import {
    marketsFetch,
    selectMarkets,
    selectWallets,
    walletsFetch,
    marketPriceFetch,
    selectMarketPrice,
    selectMarketPriceFetchSuccess,
    createQuickExchangeFetch,
} from '../../modules'
import { SwipeIcon } from '../../assets/images/swipe';
import { QuickExchangeForm, DropdownComponent, Timer } from '../../components';
import {
    getCurrencyForMarket,
    getCurrencyFiltred,
    getMarket,
    getWallets,
    getWallet,
    getBaseAmount,
    getQuoteAmount,
} from './helpers';
import { precisionRegExp, ssToMMSS } from '../../helpers';

interface QuickExchangeTimer {
    initialSeconds: number;
    initialMinutes: number;
};

interface QuickExchangeInterface {
    amount: string;
    currency: string;
    iconURL: string;
};

const DEFAULT_VALUE_TIMER: QuickExchangeTimer = {
    initialSeconds: 0,
    initialMinutes: 0,
};

const DEFAULT_VALUE: QuickExchangeInterface = {
    amount: '',
    currency: '',
    iconURL: '',
};

export const QuickExchangeContainer = () => {
    const [base, setBaseData] = useState<QuickExchangeInterface>(DEFAULT_VALUE);
    const [quote, setQuoteData] = useState<QuickExchangeInterface>(DEFAULT_VALUE);
    const [type, setType] = useState('buy');
    const [dropdownKey, setDropdownKey] = useState('');
    const [marketID, setMarket] = useState('');
    const [basePrecision, setBasePrecision] = useState(0);
    const [quotePrecision, setQuotePrecision] = useState(0);
    const [time, setTime] = useState<QuickExchangeTimer>(DEFAULT_VALUE_TIMER);

    const { formatMessage } = useIntl();
    const dispatch = useDispatch();

    const wallets = useSelector(selectWallets) || [];
    const markets = useSelector(selectMarkets) || [];
    const marketPrice = useSelector(selectMarketPrice);
    const updateTimer = useSelector(selectMarketPriceFetchSuccess);

    const translate = useCallback((id: string) => formatMessage({ id: id }), [formatMessage]);

    useCurrenciesFetch();

    const updateMarketPrice = () => {
        if (currentSelectedMarket) {
            dispatch(marketPriceFetch({ market: currentSelectedMarket.id, side: type }));
        }
    };

    React.useEffect(() => {
        const seconds = +msPricesUpdates() / 1000;
        setTime(ssToMMSS(seconds));

        dispatch(walletsFetch());
        dispatch(marketsFetch({type: 'qe'}));
    }, []);

    const currentSelectedMarket = React.useMemo(() => getMarket(marketID, markets), [marketID]);

    React.useEffect(() => {
        updateMarketPrice();
    }, [currentSelectedMarket, type]);

    const marketCurrency = React.useMemo(() => getCurrencyForMarket(markets), [markets]);
    const marketsBaseUnit = React.useMemo(() =>
        getCurrencyFiltred(quote.currency, base.currency, dropdownKey, marketCurrency, markets), [base, quote, dropdownKey, marketCurrency, markets]);
    const marketsQuoteUnit = React.useMemo(() =>
        getCurrencyFiltred(base.currency, quote.currency, dropdownKey, marketCurrency, markets), [base, quote, dropdownKey, marketCurrency, markets]);
    const walletsBaseUnit = React.useMemo(() =>
        getWallets(wallets, marketsBaseUnit), [wallets, marketsBaseUnit]);
    const walletsQuoteUnit = React.useMemo(() =>
        getWallets(wallets, marketsQuoteUnit), [wallets, marketsQuoteUnit]);

    const walletBase = React.useMemo(() => getWallet(base.currency, wallets), [base.currency, wallets]);
    const walletQuote = React.useMemo(() => getWallet(quote.currency, wallets), [quote.currency, wallets]);

    const walletsBaseList = walletsBaseUnit.length ? walletsBaseUnit.map(item => item.currency && item.currency.toUpperCase()) : [];
    const walletsQuoteList = walletsQuoteUnit.length ? walletsQuoteUnit.map(item => item.currency && item.currency.toUpperCase()) : [];

    const handleChangeValue = (value: string, key: string) => {
        const precision = key === 'base_value' ? basePrecision : quotePrecision;

        if (walletBase && value.match(precisionRegExp(precision))) {
            const [baseAmount, quoteAmount] = key === 'base_value'
                ? getBaseAmount(walletBase, value, marketPrice.price, base.amount, quote.amount)
                : getQuoteAmount(walletBase, value, marketPrice.price, base.amount, quote.amount);

            const newBaseValue = {
                ...base,
                amount: baseAmount,
            };
            const newQuoteValue = {
                ...quote,
                amount: quoteAmount,
            };
            setBaseData(newBaseValue);
            setQuoteData(newQuoteValue);
        }
    };

    const handleChangeDropdownBase = React.useCallback((index: number) => {
        const market = { id: '' };
        const value = walletsBaseList[index];
        const marketExists = markets.some(item => item.id === (value + quote.currency).toLowerCase());
        const marketMirrorExists = markets.some(item => item.id === (quote.currency + value).toLowerCase());

        if (marketExists) {
            market.id = (value + quote.currency).toLowerCase();
            const currentMarket = getMarket(market.id, markets);

            if (currentMarket) {
                setType('buy');
                setMarket(market.id);
                setBasePrecision(currentMarket.amount_precision);
                setQuotePrecision(currentMarket.price_precision);
            }
        } else if (marketMirrorExists) {
            market.id = (quote.currency + value).toLowerCase();
            const currentMarket = getMarket(market.id, markets);

            if (currentMarket) {
                setType('sell');
                setMarket(market.id);
                setBasePrecision(currentMarket.price_precision);
                setQuotePrecision(currentMarket.amount_precision);
            }
        }

        if (base.currency !== value && base.currency !== '') {
            setQuoteData(DEFAULT_VALUE);
        }

        const newBaseCurrency: QuickExchangeInterface = {
            amount: '',
            currency: value,
            iconURL: '',
        };
        setBaseData(newBaseCurrency);
        setDropdownKey('base_unit');
    }, [walletsBaseList, markets, base, quote]);

    const handleChangeDropdownQuote = React.useCallback((index: number) => {
        const market = { id: '' };
        const value = walletsQuoteList[index];
        const marketExists = markets.some(item => item.id === (base.currency + value).toLowerCase());
        const marketMirrorExists = markets.some(item => item.id === (value + base.currency).toLowerCase());

        if (marketExists) {
            market.id = (base.currency + value).toLowerCase();
            const currentMarket = getMarket(market.id, markets);

            if (currentMarket) {
                setType('buy');
                setMarket(market.id);
                setBasePrecision(currentMarket.amount_precision);
                setQuotePrecision(currentMarket.price_precision);
            }
        } else if (marketMirrorExists) {
            market.id = (value + base.currency).toLowerCase();
            const currentMarket = getMarket(market.id, markets);

            if (currentMarket) {
                setType('sell');
                setMarket(market.id);
                setBasePrecision(currentMarket.price_precision);
                setQuotePrecision(currentMarket.amount_precision);
            }
        }

        if (quote.currency !== value && quote.currency !== '') {
            setBaseData(DEFAULT_VALUE);
        }

        const newQuoteCurrency: QuickExchangeInterface = {
            amount: '',
            currency: value,
            iconURL: '',
        };
        setQuoteData(newQuoteCurrency);
        setDropdownKey('quote_unit');
    }, [walletsQuoteList, markets, base, quote]);

    const swapFields = () => {
        setType(type === 'buy' ? 'sell' : 'buy');
        setBasePrecision(currentSelectedMarket.price_precision);
        setQuotePrecision(currentSelectedMarket.amount_precision);
        setBaseData(quote);
        setQuoteData(base);
    };

    const handleSubmitExchange = () => {
        const payload = {
            amount: base.amount,
            price: marketPrice.price,
            side: type,
            market: currentSelectedMarket.id,
        };

        dispatch(createQuickExchangeFetch(payload));
    };

    const renderBase = React.useMemo(() => {
        return (
            <div className="cr-quick-exchange__body-currency-block">
                <QuickExchangeForm
                    field="exchange"
                    handleChangeInput={value => handleChangeValue(value, 'base_value')}
                    value={base.amount}
                    fixed={currentSelectedMarket ? currentSelectedMarket.price_precision : undefined}
                    isDisabled={!walletBase || !walletQuote}
                />
                <DropdownComponent
                    className="cr-quick-exchange__body-currency-block-dropdown"
                    list={walletsBaseList}
                    selectedValue={base.currency.toUpperCase()}
                    onSelect={handleChangeDropdownBase}
                    placeholder="Currency"
                />
            </div>
        );
    }, [walletsBaseList, base, quote, handleChangeDropdownBase, quote.currency]);

    const renderSwap = React.useMemo(() => {
        return (
            <div className="cr-quick-exchange__body-swap">
                <SwipeIcon onClick={swapFields} />
            </div>
        );
    }, [swapFields]);

    const renderQuote = React.useMemo(() => {
        return (
            <div className="cr-quick-exchange__body-currency-block">
                <QuickExchangeForm
                    field="receive"
                    handleChangeInput={value => handleChangeValue(value, 'quote_value')}
                    value={quote.amount}
                    fixed={currentSelectedMarket ? currentSelectedMarket.amount_precision : undefined}
                    isDisabled={!walletBase || !walletQuote}
                />
                <DropdownComponent
                    className="cr-quick-exchange__body-currency-block-dropdown"
                    list={walletsQuoteList}
                    selectedValue={quote.currency.toUpperCase()}
                    onSelect={handleChangeDropdownQuote}
                    placeholder="Currency"
                />
            </div>
        );
    }, [walletsQuoteList, base.amount, quote.currency, quote.amount, handleChangeDropdownQuote, base.currency]);

    const renderSummaryBlock = React.useMemo(() => {
        if (!base.currency || !quote.currency) {
            return null;
        }

        return (
            <div className="cr-quick-exchange__body-summary">
                <div className="cr-quick-exchange__body-summary-currency">
                    <div className="cr-quick-exchange__body-summary-currency-label">
                        You exchange
                    </div>
                    <div className="cr-quick-exchange__body-summary-currency-value">
                        {base.amount} {base.currency.toUpperCase()}
                    </div>
                </div>
                <div className="cr-quick-exchange__body-summary-icons">
                    Icons
                </div>
                <div className="cr-quick-exchange__body-summary-currency">
                    <div className="cr-quick-exchange__body-summary-currency-label">
                        You receive
                    </div>
                    <div className="cr-quick-exchange__body-summary-currency-value">
                        {quote.amount} {quote.currency.toUpperCase()}
                    </div>
                </div>
            </div>
        );
    }, [base, quote]);

    const renderPriceBlock = React.useMemo(() => {
        if (!base.currency || !marketPrice.price) {
            return null;
        }

        return (
            <div className="cr-quick-exchange__body-info">
                <div className="cr-quick-exchange__body-info-price">
                    Estimated price: <span>~{marketPrice.price} {base.currency.toUpperCase()}</span>
                </div>
                <div className="cr-quick-exchange__body-info-warning">
                    Slippage is higher than 1%. Enter a lower amount to get a better price
                </div>
            </div>
        );
    }, [marketPrice.price, base]);

    return (
        <div className="cr-quick-exchange">
            <div className="cr-quick-exchange__header">
                {translate('page.body.quick.exchange.header')}
            </div>
            <div className="cr-quick-exchange__body">
                {time.initialMinutes || time.initialSeconds ? <Timer updateTimer={updateTimer} {...time} handleRequest={updateMarketPrice} /> : null}
                {renderBase}
                {renderSwap}
                {renderQuote}
                {renderSummaryBlock}
                {renderPriceBlock}
                <div className="cr-quick-exchange__body-button">
                    <Button
                        onClick={handleSubmitExchange}
                        size="lg"
                        variant="primary"
                        disabled={!base.amount || !quote.amount}
                    >
                        Exchange
                    </Button>
                </div>
            </div>
        </div>
    );
};
