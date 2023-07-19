// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

contract Boundary {
    mapping(address => uint256) public points;
    mapping(address => Task) tasks;

    struct Task {
        uint256 state; // 0 - Not Started, 1 - In Progress, 2 - Completed
        uint256 points;
    }

    function startTask() external {
        tasks[msg.sender] = Task(1, 0);
    }

    function checkPoint(uint256 _points) external {
        require(tasks[msg.sender].state == 1);
        tasks[msg.sender].points += _points;
    }

    function completeTask() external {
        require(tasks[msg.sender].state == 1);
        tasks[msg.sender].state = 2;
    }
}
