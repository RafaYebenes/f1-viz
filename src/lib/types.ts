
type DashboardData = {
	username: string;
	car_id: number | null;
	track_id: number | null;
	timestamp: number;
	rpm: number;
	gear: number;
	speed_kph: number;
	brake: number;
	throttle: number;
	fuel: number;
	lap_time_ms: number;
	invalid_lap: number;
	current_lap: number;
	sector: number;
	sector_1_time: number;
	sector_2_time: number;
};
