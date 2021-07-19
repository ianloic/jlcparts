import React from "react";
import {InlineSpinbox} from "./componentTable.js"

export function getQuantityPrice(quantity, pricelist) {
    for (let pricepoint of pricelist) {
        if (quantity >= pricepoint.qFrom && (quantity <= pricepoint.qTo || !pricepoint.qTo))
            return pricepoint.price;
    }
    if (pricelist[0])
        return pricelist[0].price;
    return undefined;
}

export class AttritionInfo extends React.Component {
    constructor(props) {
        super(props);
        this.props = props;
        console.log(props);
        this.state = {}
    }

    componentDidMount() {
        fetch("https://cors.bridged.cc/https://jlcpcb.com/shoppingCart/smtGood/selectSmtComponentList", {
            method: 'POST',
            headers: {
                "Accept": 'application/json, text/plain, */*',
                "Content-Type": 'application/json;charset=UTF-8',
            },
            body: JSON.stringify({
                "currentPage": 1,
                "pageSize": 25,
                "keyword": this.props.component.lcsc,
                "firstSortName": "",
                "secondeSortName": "",
                "searchSource": "search",
                "componentAttributes": []
            })
        })
        .then(response => {
            if (!response.ok || response.status !== 200) {
                throw new Error(`Cannot fetch ${this.props.component.lcsc}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(responseJson => {
            let lcscId = null;
            responseJson["data"]["componentPageInfo"]["list"].forEach(component => {
                if (component["componentCode"] === this.props.component.lcsc)
                    lcscId = component["componentId"];
            })
            if (lcscId === null) {
                throw new Error(`No search results for ${this.props.component.lcsc}`);
            }
            return fetch("https://cors.bridged.cc/https://jlcpcb.com/shoppingCart/smtGood/getComponentDetail?componentLcscId=" + lcscId);
        })
        .then(response => {
            if (!response.ok || response.status !== 200) {
                throw new Error(`Cannot fetch ${this.props.lcsc}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(responseJson => {
            this.setState({data: responseJson.data});
        })
        .catch(error => {
            this.setState({error: true});
            console.log(error);
        });
    }

    price() {
        let q = Math.max(parseInt(this.props.quantity) + parseInt(this.state.data.lossNumber),
            this.state.data.leastNumber);
        return q * getQuantityPrice(q, this.props.component.price);
    }

    render() {
        let data = this.state.data;
        if (this.state.error) {
            return <div className="bg-yellow-400 p-2 mt-2">
                Cannot fetch attrition data from JLC website. This is a&nbsp;
                <a href="https://github.com/yaqwsx/jlcparts/issues/36"
                   className="underline text-blue-500 hover:text-blue-800">
                       known problem
                </a>. As a workaround, you can install&nbsp;
                <a href="https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf?hl=en"
                   className="underline text-blue-500 hover:text-blue-800">
                       Allow-CORS-Access-Control browser extension
                </a>.
                After installing, enabling and reloading, the attrition information will be available again.
            </div>
        }
        if (data)
            return <table className="w-full">
                <tbody>
                { data.lossNumber
                    ? <tr>
                        <td className="w-1 whitespace-no-wrap">Attrition:</td>
                        <td className="px-2">{data.lossNumber} pcs</td>
                      </tr>
                    : ""
                }
                { data.leastNumber
                    ? <tr>
                        <td className="w-1 whitespace-no-wrap">Minimal order quantity:</td>
                        <td className="px-2">{data.leastNumber} pcs</td>
                      </tr>
                    : ""
                }
                <tr>
                    <td className="w-1 whitespace-no-wrap">Price for {this.props.quantity} pcs:</td>
                    <td className="px-2">{Math.round((this.price() + Number.EPSILON) * 1000) / 1000} USD</td>
                </tr>
                </tbody>
            </table>
        return <div className="w-full p-4 text-center">
                <InlineSpinbox/>
            </div>;
    }
}