import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedHealthAnalyzer = await deploy("HealthAnalyzer", {
    from: deployer,
    log: true,
  });

  console.log(`HealthAnalyzer contract deployed at: `, deployedHealthAnalyzer.address);
};
export default func;
func.id = "deploy_healthAnalyzer"; // id required to prevent reexecution
func.tags = ["HealthAnalyzer"];

