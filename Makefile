SOURCE_FILE := build/temp/SCW.abi
OUTPUT_FILE := app/src/constants/scw-abi.ts

.PHONY: all clean

all: solace_scw

clean:
	rm -rf build

solace_scw:
	mkdir -p build/temp/
	@echo "Creating .abi files"

	solc --abi contracts/SolaceAccountFactory.sol --include-path node_modules --base-path . -o build/temp --overwrite 
	solc --abi contracts/SolaceAccount.sol --include-path node_modules --base-path . -o build/temp --overwrite 

	@echo " "
	@echo "Creating .bin files"

	solc --optimize --bin contracts/SolaceAccountFactory.sol --include-path node_modules --base-path . -o build/temp --overwrite
	solc --optimize --bin contracts/SolaceAccount.sol --include-path node_modules --base-path . -o build/temp --overwrite


	@echo " "
	@echo "Creating go files"

	mkdir -p SolaceAccountFactory
	abigen --abi=./build/temp/SolaceAccountFactory.abi --pkg=SolaceAccountFactory --out=SolaceAccountFactory/SolaceAccountFactory.go
	mkdir -p SolaceAccount 
	abigen --abi=./build/temp/SolaceAccount.abi --pkg=SolaceAccount --out=SolaceAccount/SolaceAccount.go

	@echo " "
	@echo "Moving things to right places"

	mkdir -p go/

	mv SolaceAccountFactory go/SolaceAccountFactory
	mv SolaceAccount go/SolaceAccount

	# cat build/temp/SolaceAccount.abi | sed 's/^/export const SCW_ABI = /' | tee app/src/constants/scw-abi.ts > /dev/null
	# cat build/temp/SolaceAccountFactory.abi | sed 's/^/export const SCW_FACTORY_ABI = /' | tee app/src/constants/scw-factory-abi.ts > /dev/null
	# cat build/temp/MinimalForwarder.abi | sed 's/^/export const MINIMAL_FORWARDER_ABI = /' | tee app/src/constants/minimal-forwarder-abi.ts > /dev/null 

	@echo " "
	@echo "Done"

