// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

contract Boundary {
    mapping(address => uint256) public values;

    function setValue(uint256 _value) external {
        values[msg.sender] = _value;
    }
}
