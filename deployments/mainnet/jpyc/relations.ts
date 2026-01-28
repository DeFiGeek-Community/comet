import { RelationConfigMap } from "../../../plugins/deployment_manager/RelationConfig";
import baseRelationConfig from "../../relations";

const relationConfigMap = (): RelationConfigMap => {
  const relationConfigMap = baseRelationConfig;

  delete relationConfigMap.comptrollerV2;
  delete relationConfigMap.comet.relations?.cometAdmin;
  delete relationConfigMap.configurator;
  delete relationConfigMap.cometAdmin;
  delete relationConfigMap.timelock;
  delete relationConfigMap.governor;

  // JPYC
  relationConfigMap.comet.relations.baseToken = {
    alias: "JPYC",
  };
  relationConfigMap.comet.relations.baseTokenPriceFeed = {
    field: async (comet) => comet.baseTokenPriceFeed(),
    alias: async (_, { baseToken }) => `JPYC:priceFeed`,
  };
  return relationConfigMap;
};

export default relationConfigMap();
