import {
  RemoteConfigParameter,
  RemoteConfigCondition,
  RemoteConfigSnapshot,
  RemoteConfigChangeRequest,
} from '../types';

export class DiffService {
  generateDiff(
    baseConfig: RemoteConfigSnapshot,
    newConfig: RemoteConfigSnapshot
  ): RemoteConfigChangeRequest['diff'] {
    const baseParamsMap = new Map(baseConfig.parameters.map((p) => [p.key, p]));
    const newParamsMap = new Map(newConfig.parameters.map((p) => [p.key, p]));

    const addedParams: string[] = [];
    const removedParams: string[] = [];
    const updatedParams: {
      key: string;
      from: RemoteConfigParameter | null;
      to: RemoteConfigParameter | null;
    }[] = [];

    // Find added and updated parameters
    for (const [key, newParam] of newParamsMap) {
      const baseParam = baseParamsMap.get(key);
      if (!baseParam) {
        addedParams.push(key);
      } else if (!this.areParamsEqual(baseParam, newParam)) {
        updatedParams.push({
          key,
          from: baseParam,
          to: newParam,
        });
      }
    }

    // Find removed parameters
    for (const [key] of baseParamsMap) {
      if (!newParamsMap.has(key)) {
        removedParams.push(key);
      }
    }

    // Conditions diff
    const baseConditionsMap = new Map(baseConfig.conditions.map((c) => [c.name, c]));
    const newConditionsMap = new Map(newConfig.conditions.map((c) => [c.name, c]));

    const addedConditions: string[] = [];
    const removedConditions: string[] = [];
    const updatedConditions: {
      name: string;
      from: RemoteConfigCondition | null;
      to: RemoteConfigCondition | null;
    }[] = [];

    for (const [name, newCondition] of newConditionsMap) {
      const baseCondition = baseConditionsMap.get(name);
      if (!baseCondition) {
        addedConditions.push(name);
      } else if (!this.areConditionsEqual(baseCondition, newCondition)) {
        updatedConditions.push({
          name,
          from: baseCondition,
          to: newCondition,
        });
      }
    }

    for (const [name] of baseConditionsMap) {
      if (!newConditionsMap.has(name)) {
        removedConditions.push(name);
      }
    }

    return {
      addedParams,
      removedParams,
      updatedParams,
      addedConditions,
      removedConditions,
      updatedConditions,
    };
  }

  private areParamsEqual(param1: RemoteConfigParameter, param2: RemoteConfigParameter): boolean {
    if (param1.defaultValue !== param2.defaultValue) return false;
    if (param1.description !== param2.description) return false;

    const cond1 = param1.conditionalValues || {};
    const cond2 = param2.conditionalValues || {};
    const cond1Keys = Object.keys(cond1).sort();
    const cond2Keys = Object.keys(cond2).sort();

    if (cond1Keys.length !== cond2Keys.length) return false;

    for (const key of cond1Keys) {
      if (cond1[key] !== cond2[key]) return false;
    }

    return true;
  }

  private areConditionsEqual(
    cond1: RemoteConfigCondition,
    cond2: RemoteConfigCondition
  ): boolean {
    return cond1.expression === cond2.expression && cond1.tag === cond2.tag;
  }
}

