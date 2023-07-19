// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

contract Game {
    struct Task {
        uint state; // 0 - Not Started, 1 - In Progress, 2 - Completed
        uint points;
    }

    struct Item {
        uint itemID;
        uint cost;
        uint level;
    }

    struct Player {
        uint points;
        mapping(uint => Task) tasks;
        mapping(uint => Item) items;
    }

    mapping(address => Player) public players;
    mapping(address => uint) public points;

    event StartedTask(address player, uint taskID);
    event CompletedTask(address player, uint taskID);
    event EarnedPoints(address player, uint points);
    event BoughtItem(address player, uint itemID);
    event UpgradedItem(address player, uint itemID);
    event TransferredPoints(address from, address to, uint points);

    function startTask(uint _taskID, uint _points) external {
        players[msg.sender].tasks[_taskID] = Task(1, _points);
        points[msg.sender] = _points;
        emit StartedTask(msg.sender, _taskID);
    }

    function nothin(uing _id, uint _tent) external {
        
    }

    function completeTask(uint _taskID) public {
        require(
            players[msg.sender].tasks[_taskID].state == 1,
            "Task either not started or already completed"
        );
        players[msg.sender].tasks[_taskID].state = 2;
        players[msg.sender].points += players[msg.sender].tasks[_taskID].points;
        emit CompletedTask(msg.sender, _taskID);
        emit EarnedPoints(
            msg.sender,
            players[msg.sender].tasks[_taskID].points
        );
    }

    function buyItem(uint _itemID, uint _cost) public {
        require(
            players[msg.sender].points >= _cost,
            "Not enough points to buy this item"
        );
        players[msg.sender].points -= _cost;
        players[msg.sender].items[_itemID] = Item(_itemID, _cost, 1);
        emit BoughtItem(msg.sender, _itemID);
    }

    function upgradeItem(uint _itemID, uint _upgradeCost) public {
        require(
            players[msg.sender].points >= _upgradeCost,
            "Not enough points to upgrade this item"
        );
        require(
            players[msg.sender].items[_itemID].itemID == _itemID,
            "Item not owned by player"
        );
        players[msg.sender].points -= _upgradeCost;
        players[msg.sender].items[_itemID].level++;
        emit UpgradedItem(msg.sender, _itemID);
    }

    function transferPoints(address _to, uint _points) public {
        require(
            players[msg.sender].points >= _points,
            "Not enough points to make this transfer"
        );
        players[msg.sender].points -= _points;
        players[_to].points += _points;
        emit TransferredPoints(msg.sender, _to, _points);
    }

    function checkPoints() public view returns (uint) {
        return players[msg.sender].points;
    }

    function checkTaskStatus(uint _taskID) public view returns (uint) {
        return players[msg.sender].tasks[_taskID].state;
    }

    function checkItemLevel(uint _itemID) public view returns (uint) {
        return players[msg.sender].items[_itemID].level;
    }
}
