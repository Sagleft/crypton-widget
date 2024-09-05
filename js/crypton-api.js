const baseUrl = 'https://crp.is:8182/';

function body(obj){
    let res = '';
    for(const p in obj) if(obj[p]) res += `${encodeURIComponent(p)}=${encodeURIComponent(obj[p])}&`;
    return res.slice(0, -1);
}

function argsInUrl(method){
    return method === 'GET';
}

function transportCORS(method, url, body){
    const options = {
        method,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };
    if(body) options.body = body;
    return fetch('https://cors.io/?' + url, options).then(v => v.text());
}

function transport(method, url, body){
    const options = {
        method,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };
    if(body) options.body = body;
    return fetch(url, options).then(v => v.text());
}

function saveToken(token){
    document.cookie = `auth_token=${token}`;
}

class CryptonAPI{
    #transport
    #saveToken

    constructor(transport, saveToken){
        this.#transport = transport;
        this.#saveToken = saveToken;
    }

    async #call(method, httpMethod, args){
        const urlArgs = argsInUrl(method);
        const data = args ? body(args) : '';
        let url = `${baseUrl}${method}`;
        if(urlArgs) url += `?${data}`;
        const parsed = JSON.parse(await this.#transport(httpMethod, url, urlArgs ? null : data));
        if(parsed.success){
            return parsed.result;
        } else {
            throw new Error(`${parsed.code}: ${parsed.text}`)
        }
    }

    async login(pubkey, password, pin){
        const { auth_token, user_session: { session, user } } = await this.#call('user/login', 'POST', {
            PublicKey: pubkey,
            password,
            '2fa_pin': pin,
        });
        this.session = session;
        this.user = user;
        await this.#saveToken(auth_token);
    }

    async logout(){
        await this.#call('user/logout', 'POST');
    }

    balance(){
        return this.#call('user/balance', 'GET');
    }

    buy(pair, amount, price){
        return this.#call('market/buy', 'POST', { pair, amount, price });
    }

    sell(pair, amount, price){
        return this.#call('market/sell', 'POST', { pair, amount, price });
    }

    hold(orderId){
        return this.#call('market/hold', 'POST', { order_id: orderId });
    }

    hold(orderId){
        return this.#call('market/cancel', 'POST', { order_id: orderId });
    }

    async pairs(){
        return this.#call('market/pairs', 'GET');
    }

    panel(pair){
        return this.#call('market/panel', 'POST', { pair });
    }

    curlist(){
        return this.#call('market/curlist', 'GET');
    }

    orders(status, task){
        return this.#call('orders', 'GET', { status, task });
    }

    orderHistory(orderId){
        return this.#call('orders/history', 'POST', { order_id: orderId });
    }

    history(type){
        return this.#call('history', 'POST', { type });
    }

    tradeHistory(orderId){
        return this.#call('history/trade', 'GET', { order_id: orderId });
    }
}
