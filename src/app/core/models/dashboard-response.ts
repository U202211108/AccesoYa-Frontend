export interface DashboardDistribution {
    value: string;
    count: number;
}

export interface DashboardResponse {

    totalSites: number;

    byZonal: DashboardDistribution[];

    byDepartment: DashboardDistribution[];

    byProvince: DashboardDistribution[];

    byDistrict: DashboardDistribution[];

    byStationType: DashboardDistribution[];

    byTechnology: DashboardDistribution[];

    byTowerOwner: DashboardDistribution[];

    byTowerOwnerClassification: DashboardDistribution[];

    reactionCoverage: DashboardDistribution[];

    patrol: DashboardDistribution[];

    guard: DashboardDistribution[];

    surveillance: DashboardDistribution[];

    dynamicRound: DashboardDistribution[];

    csiMonitoring: DashboardDistribution[];
}