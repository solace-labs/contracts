// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package SolaceAccountFactory

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
)

// SolaceAccountFactoryMetaData contains all meta data concerning the SolaceAccountFactory contract.
var SolaceAccountFactoryMetaData = &bind.MetaData{
	ABI: "[{\"inputs\":[{\"internalType\":\"contractIEntryPoint\",\"name\":\"_entryPoint\",\"type\":\"address\"}],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"inputs\":[],\"name\":\"accountImplementation\",\"outputs\":[{\"internalType\":\"contractSolaceAccount\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"salt\",\"type\":\"uint256\"}],\"name\":\"createAccount\",\"outputs\":[{\"internalType\":\"contractSolaceAccount\",\"name\":\"ret\",\"type\":\"address\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"salt\",\"type\":\"uint256\"}],\"name\":\"getAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]",
}

// SolaceAccountFactoryABI is the input ABI used to generate the binding from.
// Deprecated: Use SolaceAccountFactoryMetaData.ABI instead.
var SolaceAccountFactoryABI = SolaceAccountFactoryMetaData.ABI

// SolaceAccountFactory is an auto generated Go binding around an Ethereum contract.
type SolaceAccountFactory struct {
	SolaceAccountFactoryCaller     // Read-only binding to the contract
	SolaceAccountFactoryTransactor // Write-only binding to the contract
	SolaceAccountFactoryFilterer   // Log filterer for contract events
}

// SolaceAccountFactoryCaller is an auto generated read-only Go binding around an Ethereum contract.
type SolaceAccountFactoryCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// SolaceAccountFactoryTransactor is an auto generated write-only Go binding around an Ethereum contract.
type SolaceAccountFactoryTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// SolaceAccountFactoryFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type SolaceAccountFactoryFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// SolaceAccountFactorySession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type SolaceAccountFactorySession struct {
	Contract     *SolaceAccountFactory // Generic contract binding to set the session for
	CallOpts     bind.CallOpts         // Call options to use throughout this session
	TransactOpts bind.TransactOpts     // Transaction auth options to use throughout this session
}

// SolaceAccountFactoryCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type SolaceAccountFactoryCallerSession struct {
	Contract *SolaceAccountFactoryCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts               // Call options to use throughout this session
}

// SolaceAccountFactoryTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type SolaceAccountFactoryTransactorSession struct {
	Contract     *SolaceAccountFactoryTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts               // Transaction auth options to use throughout this session
}

// SolaceAccountFactoryRaw is an auto generated low-level Go binding around an Ethereum contract.
type SolaceAccountFactoryRaw struct {
	Contract *SolaceAccountFactory // Generic contract binding to access the raw methods on
}

// SolaceAccountFactoryCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type SolaceAccountFactoryCallerRaw struct {
	Contract *SolaceAccountFactoryCaller // Generic read-only contract binding to access the raw methods on
}

// SolaceAccountFactoryTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type SolaceAccountFactoryTransactorRaw struct {
	Contract *SolaceAccountFactoryTransactor // Generic write-only contract binding to access the raw methods on
}

// NewSolaceAccountFactory creates a new instance of SolaceAccountFactory, bound to a specific deployed contract.
func NewSolaceAccountFactory(address common.Address, backend bind.ContractBackend) (*SolaceAccountFactory, error) {
	contract, err := bindSolaceAccountFactory(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &SolaceAccountFactory{SolaceAccountFactoryCaller: SolaceAccountFactoryCaller{contract: contract}, SolaceAccountFactoryTransactor: SolaceAccountFactoryTransactor{contract: contract}, SolaceAccountFactoryFilterer: SolaceAccountFactoryFilterer{contract: contract}}, nil
}

// NewSolaceAccountFactoryCaller creates a new read-only instance of SolaceAccountFactory, bound to a specific deployed contract.
func NewSolaceAccountFactoryCaller(address common.Address, caller bind.ContractCaller) (*SolaceAccountFactoryCaller, error) {
	contract, err := bindSolaceAccountFactory(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &SolaceAccountFactoryCaller{contract: contract}, nil
}

// NewSolaceAccountFactoryTransactor creates a new write-only instance of SolaceAccountFactory, bound to a specific deployed contract.
func NewSolaceAccountFactoryTransactor(address common.Address, transactor bind.ContractTransactor) (*SolaceAccountFactoryTransactor, error) {
	contract, err := bindSolaceAccountFactory(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &SolaceAccountFactoryTransactor{contract: contract}, nil
}

// NewSolaceAccountFactoryFilterer creates a new log filterer instance of SolaceAccountFactory, bound to a specific deployed contract.
func NewSolaceAccountFactoryFilterer(address common.Address, filterer bind.ContractFilterer) (*SolaceAccountFactoryFilterer, error) {
	contract, err := bindSolaceAccountFactory(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &SolaceAccountFactoryFilterer{contract: contract}, nil
}

// bindSolaceAccountFactory binds a generic wrapper to an already deployed contract.
func bindSolaceAccountFactory(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(SolaceAccountFactoryABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_SolaceAccountFactory *SolaceAccountFactoryRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _SolaceAccountFactory.Contract.SolaceAccountFactoryCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_SolaceAccountFactory *SolaceAccountFactoryRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _SolaceAccountFactory.Contract.SolaceAccountFactoryTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_SolaceAccountFactory *SolaceAccountFactoryRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _SolaceAccountFactory.Contract.SolaceAccountFactoryTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_SolaceAccountFactory *SolaceAccountFactoryCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _SolaceAccountFactory.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_SolaceAccountFactory *SolaceAccountFactoryTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _SolaceAccountFactory.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_SolaceAccountFactory *SolaceAccountFactoryTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _SolaceAccountFactory.Contract.contract.Transact(opts, method, params...)
}

// AccountImplementation is a free data retrieval call binding the contract method 0x11464fbe.
//
// Solidity: function accountImplementation() view returns(address)
func (_SolaceAccountFactory *SolaceAccountFactoryCaller) AccountImplementation(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _SolaceAccountFactory.contract.Call(opts, &out, "accountImplementation")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// AccountImplementation is a free data retrieval call binding the contract method 0x11464fbe.
//
// Solidity: function accountImplementation() view returns(address)
func (_SolaceAccountFactory *SolaceAccountFactorySession) AccountImplementation() (common.Address, error) {
	return _SolaceAccountFactory.Contract.AccountImplementation(&_SolaceAccountFactory.CallOpts)
}

// AccountImplementation is a free data retrieval call binding the contract method 0x11464fbe.
//
// Solidity: function accountImplementation() view returns(address)
func (_SolaceAccountFactory *SolaceAccountFactoryCallerSession) AccountImplementation() (common.Address, error) {
	return _SolaceAccountFactory.Contract.AccountImplementation(&_SolaceAccountFactory.CallOpts)
}

// GetAddress is a free data retrieval call binding the contract method 0x8cb84e18.
//
// Solidity: function getAddress(address owner, uint256 salt) view returns(address)
func (_SolaceAccountFactory *SolaceAccountFactoryCaller) GetAddress(opts *bind.CallOpts, owner common.Address, salt *big.Int) (common.Address, error) {
	var out []interface{}
	err := _SolaceAccountFactory.contract.Call(opts, &out, "getAddress", owner, salt)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetAddress is a free data retrieval call binding the contract method 0x8cb84e18.
//
// Solidity: function getAddress(address owner, uint256 salt) view returns(address)
func (_SolaceAccountFactory *SolaceAccountFactorySession) GetAddress(owner common.Address, salt *big.Int) (common.Address, error) {
	return _SolaceAccountFactory.Contract.GetAddress(&_SolaceAccountFactory.CallOpts, owner, salt)
}

// GetAddress is a free data retrieval call binding the contract method 0x8cb84e18.
//
// Solidity: function getAddress(address owner, uint256 salt) view returns(address)
func (_SolaceAccountFactory *SolaceAccountFactoryCallerSession) GetAddress(owner common.Address, salt *big.Int) (common.Address, error) {
	return _SolaceAccountFactory.Contract.GetAddress(&_SolaceAccountFactory.CallOpts, owner, salt)
}

// CreateAccount is a paid mutator transaction binding the contract method 0x5fbfb9cf.
//
// Solidity: function createAccount(address owner, uint256 salt) returns(address ret)
func (_SolaceAccountFactory *SolaceAccountFactoryTransactor) CreateAccount(opts *bind.TransactOpts, owner common.Address, salt *big.Int) (*types.Transaction, error) {
	return _SolaceAccountFactory.contract.Transact(opts, "createAccount", owner, salt)
}

// CreateAccount is a paid mutator transaction binding the contract method 0x5fbfb9cf.
//
// Solidity: function createAccount(address owner, uint256 salt) returns(address ret)
func (_SolaceAccountFactory *SolaceAccountFactorySession) CreateAccount(owner common.Address, salt *big.Int) (*types.Transaction, error) {
	return _SolaceAccountFactory.Contract.CreateAccount(&_SolaceAccountFactory.TransactOpts, owner, salt)
}

// CreateAccount is a paid mutator transaction binding the contract method 0x5fbfb9cf.
//
// Solidity: function createAccount(address owner, uint256 salt) returns(address ret)
func (_SolaceAccountFactory *SolaceAccountFactoryTransactorSession) CreateAccount(owner common.Address, salt *big.Int) (*types.Transaction, error) {
	return _SolaceAccountFactory.Contract.CreateAccount(&_SolaceAccountFactory.TransactOpts, owner, salt)
}
