import React, { Component } from 'react'
import getWeb3 from './utils/getWeb3'
import BountyContract from '../build/contracts/BountyContract.json'
import contract from 'truffle-contract'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'
import {
    Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink, Nav, Collapse, Card, Button, CardHeader, CardFooter, CardBody,
    CardTitle, CardText, Col, Label, Input, FormGroup
} from 'reactstrap'
import { Link } from 'react-router-dom'


class Browse extends Component {
    constructor(props) {
        super(props)
        this.state = {
            web3: null,
            account: null,
            bounties: [],
            isStopped: false
        }
        this.bountyContract = contract(BountyContract)
        this.submitSolution = this.submitSolution.bind(this)
    }

    componentWillMount() {
        getWeb3
            .then(results => {
                this.setState({
                    web3: results.web3
                })
                this.instantiateContract()
            })
            .catch(() => {
                console.log('Error finding web3.')
            }).then(() => {
                this.getBounties()
            }).then(() => this.isPaused())
    }

    instantiateContract() {

        this.bountyContract.setProvider(this.state.web3.currentProvider)
        // Declaring this for later so we can chain functions on bountyContract.

        // Get accounts.
        this.state.web3.eth.getAccounts((error, accounts) => {
            this.bountyContract.deployed().then(() => {
                this.setState({ account: accounts[0] });
            })
        })
    }

    isPaused() {
        var bountyContractInstance;
        this.bountyContract.deployed().then((instance) => {
            bountyContractInstance = instance;
            return bountyContractInstance.isStopped({ from: this.state.account })
        }).then((value) => {
            this.setState({ isStopped: value })
        })
    }


    getBounties() {
        var bountyContractInstance;
        this.bountyContract.deployed().then((instance) => {
            bountyContractInstance = instance;
            var bountiesCreated = []
            bountyContractInstance.returnBountiesCount().then((numBounties) => {
                for (var i = 0; i < numBounties.valueOf(); i++) {
                    bountyContractInstance.getBounty.call(i, { from: this.state.account }).then((bounty) => {
                        bountiesCreated.push(bounty)
                        this.setState({ bounties: bountiesCreated })
                    })
                }
            })
        })
    }

    submitSolution(bountyId) {
        var bountyContractInstance;
        this.bountyContract.deployed().then((instance) => {
            bountyContractInstance = instance;
            var solutionKey = "solution_" + bountyId
            var answer = document.getElementById(solutionKey).value;
            this.refs.solutionRef.value = ""
            return bountyContractInstance.createSolution(bountyId, answer, { from: this.state.account }).then((value) => {
                console.log(value.valueOf())
                var messageKey = "message_" + bountyId
                document.getElementById(messageKey).innerHTML = "Success"
                document.getElementById(solutionKey).value = ""
            }).catch((error) => {
                console.log(error)
            })
        })
    }


    createCard(bounty, index) {
        var bountyStage = bounty[3].valueOf() == 0 ? "Open" : bounty[3].valueOf() == 1 ? "Closed" : "Invalid State"
        return (
            <Card key={"bountyId_" + index}>
                <CardHeader tag="h3">{bountyStage}</CardHeader>
                <CardBody>
                    <CardTitle tag="h4">Problem Statement</CardTitle>
                    <CardText className="lead">{bounty[1]}</CardText>
                    <hr />
                    {bounty[3].valueOf() == 0 ? (
                        <div>
                            <FormGroup row>
                                <Col sm={1}>
                                    <Label for="bountySolution" size="lg">Solution</Label>
                                </Col>
                                <Col sm={8}>
                                    <Input type="solution" ref="solutionRef" name="solution" id={"solution_" + index} placeholder="Enter Solution" bsSize="lg" />
                                </Col>
                            </FormGroup>
                            <Button onClick={() => this.submitSolution(index)} disabled={this.state.isStopped}>Submit Solution</Button>
                        </div>
                    ) : null}
                </CardBody>
                <CardFooter tag="h3">{"Reward: " + this.state.web3.fromWei(bounty[2].valueOf(), "ether") + " ETH"}</CardFooter>
                <p key={"p_" + index} className="p" id={"message_" + index}></p>
                <br />
            </Card>
        )
    }


    render() {
        return (
            <div className="Browse">
                <div className="navbar-wrapper">
                    <Navbar expand="md" className="navbar-fixed-top">
                        <NavbarBrand href="./" className="mr-xl-5 h-25" id="navbar-header">BountyDApp</NavbarBrand>
                        <NavbarToggler onClick={this.toggle} />
                        <Collapse isOpen={this.state.isOpen} navbar>
                            <Nav navbar>
                                <NavItem className="mr-xl-5 h-25">
                                    <NavLink><Link to="/create">Create</Link></NavLink>
                                </NavItem>
                                <NavItem className="mr-xl-5 h-25">
                                    <NavLink><Link to="/browse">Browse</Link></NavLink>
                                </NavItem>
                                <NavItem className="mr-xl-5 h-25">
                                    <NavLink><Link to="/dashboard">Dashboard</Link></NavLink>
                                </NavItem>
                                <NavItem className="mr-xl-5 h-25">
                                    <NavLink><Link to="/admin">Admin</Link></NavLink>
                                </NavItem>
                            </Nav>
                        </Collapse>
                    </Navbar>
                </div>
                <h1 className="m-md-5">Browse</h1>
                <div>
                    {this.state.bounties.map((bounty, index) => { return this.createCard(bounty, index) })}
                </div>
            </div >
        );
    }
}

export default Browse
