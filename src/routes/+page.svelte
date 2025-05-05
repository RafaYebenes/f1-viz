<script lang="ts">
	import { track_names } from '$lib/track_names';
	import { onMount, onDestroy } from 'svelte';

	// WebSocket server URL
	const wsURL = 'ws://localhost:3000';

	// Create reactive state for the data
	let data: DashboardData = $state({});
	let connectionStatus = $state('Connecting...');
	let socket: WebSocket;

	// Function to establish WebSocket connection
	function connectWebSocket() {
		socket = new WebSocket(wsURL);

		socket.onopen = () => {
			connectionStatus = 'Connected';
			console.log('WebSocket connection established');
		};

		socket.onmessage = (event) => {
			try {
				const { type, payload } = JSON.parse(event.data);

				if (type === 'car_data') {
					data = payload; // dashboard principal
				} else if (type === 'car_damage') {
					// puedes guardar en otra variable si luego quieres mostrar daños
					console.log('Daño del coche:', payload);
				} else if (type === 'trackHeatMap') {
					// podrías usar esta data para pintar el mapa más adelante
					console.log('Mapa de calor recibido', payload);
				}
			} catch (error) {
				console.error('Error parsing structured WebSocket data:', error);
			}
		};


		socket.onerror = (error) => {
			connectionStatus = 'Error';
			console.error('WebSocket error:', error);
		};

		socket.onclose = (event) => {
			connectionStatus = 'Disconnected';
			console.log('WebSocket connection closed:', event.code, event.reason);

			// Attempt to reconnect after a delay
			setTimeout(() => {
				connectionStatus = 'Reconnecting...';
				connectWebSocket();
			}, 3000);
		};
	}

	// Format lap time from milliseconds to seconds
	function formatLapTime(ms: number | undefined) {
		if (ms === undefined) return '--';
		return (ms / 1000).toFixed(3);
	}

	function formatTrackName(trackId: number) {
		return track_names[trackId];
	}

	onMount(() => {
		connectWebSocket();
	});

	onDestroy(() => {
		// Clean up WebSocket connection when component is destroyed
		if (socket) {
			socket.close();
		}
	});
</script>

<div class="bg-base-100 min-h-screen">
	<div class="container mx-auto p-4">
		<div class="mb-6">
			<h1 class="mb-2 text-center text-5xl font-bold">F1 Telemetry Dashboard</h1>
			<p class="text-center text-lg">
				WebSocket Status: <span
					class={connectionStatus === 'Connected'
						? 'text-success font-bold'
						: 'text-error font-bold'}>{connectionStatus}</span
				>
			</p>
		</div>

		{#if Object.keys(data).length > 0}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				<!-- User and Car Info -->
				<div class="card bg-base-200 shadow-xl">
					<div class="card-body">
						<h2 class="card-title border-base-300 border-b pb-2">Driver Info</h2>
						<div class="grid grid-cols-2 gap-4">
							<div class="text-center">
								<div class="stat">
									<div class="stat-title">USERNAME</div>
									<div class="stat-value text-lg">
										{data.username || '--'}
									</div>
								</div>
							</div>
							<div class="text-center">
								<div class="stat">
									<div class="stat-title">CAR ID</div>
									<div class="stat-value">
										{data.car_id !== undefined ? data.car_id : '--'}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Track Info -->
				<div class="card bg-base-200 shadow-xl">
					<div class="card-body">
						<h2 class="card-title border-base-300 border-b pb-2">Track Info</h2>
						<div class="grid grid-cols-2 gap-4 text-center">
							<div class="stat">
								<div class="stat-title">TRACK ID</div>
								<div class="stat-value">
									{data.track_id !== null && data.track_id !== undefined
										? formatTrackName(data.track_id)
										: '--'}
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Speed and RPM -->
				<div class="card bg-base-200 shadow-xl">
					<div class="card-body">
						<h2 class="card-title border-base-300 border-b pb-2">Speed & Power</h2>
						<div class="grid grid-cols-2 gap-4">
							<div class="text-center">
								<div class="stat">
									<div class="stat-title">SPEED</div>
									<div class="stat-value">
										{data.speed_kph !== undefined ? Math.round(data.speed_kph) : '--'}
									</div>
									<div class="stat-desc">KM/H</div>
								</div>
							</div>
							<div class="text-center">
								<div class="stat">
									<div class="stat-title">RPM</div>
									<div class="stat-value text-2xl">
										{data.rpm !== undefined ? Math.round(data.rpm) : '--'}
									</div>
									<div class="stat-desc">RPM</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Gear and Controls -->
				<div class="card bg-base-200 shadow-xl">
					<div class="card-body">
						<h2 class="card-title border-base-300 border-b pb-2">Controls</h2>
						<div class="grid grid-cols-3 gap-4">
							<div class="text-center">
								<div class="stat">
									<div class="stat-title">GEAR</div>
									<div class="stat-value text-6xl">
										{data.gear !== undefined ? data.gear : '--'}
									</div>
								</div>
							</div>
							<div class="text-center">
								<div class="stat">
									<div class="stat-title">THROTTLE</div>
									<div class="stat-value text-success">
										{data.throttle !== undefined ? Math.round(data.throttle * 100) : '--'}
									</div>
									<progress
										class="progress progress-success w-full"
										value={data.throttle !== undefined ? data.throttle : 0}
										max="1"
									></progress>
								</div>
							</div>
							<div class="text-center">
								<div class="stat">
									<div class="stat-title">BRAKE</div>
									<div class="stat-value text-error">
										{data.brake !== undefined ? Math.round(data.brake * 100) : '--'}
									</div>
									<progress
										class="progress progress-error w-full"
										value={data.brake !== undefined ? data.brake : 0}
										max="1"
									></progress>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Fuel and Lap Time -->
				<div class="card bg-base-200 shadow-xl">
					<div class="card-body">
						<h2 class="card-title border-base-300 border-b pb-2">Performance</h2>
						<div class="grid grid-cols-2 gap-4">
							<div class="text-center">
								<div class="stat">
									<div class="stat-title">FUEL</div>
									<div class="stat-value">
										{data.fuel !== undefined ? data.fuel.toFixed(1) : '--'}
									</div>
									<div class="stat-desc">KG</div>
								</div>
							</div>
							<div class="text-center">
								<div class="stat">
									<div class="stat-title">LAP TIME</div>
									<div class="stat-value">
										{data.lap_time_ms !== undefined ? formatLapTime(data.lap_time_ms) : '--'}
									</div>
									<div class="stat-desc">SEC</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Lap Information -->
				<div class="card bg-base-200 shadow-xl">
					<div class="card-body">
						<h2 class="card-title border-base-300 border-b pb-2">Lap Information</h2>
						<div class="grid grid-cols-2 gap-4">
							<div class="text-center">
								<div class="stat">
									<div class="stat-title">CURRENT LAP</div>
									<div class="stat-value">
										{data.current_lap !== undefined ? data.current_lap : '--'}
									</div>
								</div>
							</div>
							<div class="text-center">
								<div class="stat">
									<div class="stat-title">VALID LAP</div>
									<div class="stat-value">
										{data.invalid_lap !== undefined
											? data.invalid_lap === 0
												? 'YES'
												: 'NO'
											: '--'}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Sector Times -->
				<div class="card bg-base-200 shadow-xl">
				<div class="card-body">
					<h2 class="card-title border-base-300 border-b pb-2">Sector Times</h2>
					<div class="grid grid-cols-4 gap-4">
						<!-- Sector actual -->
						<div class="text-center">
							<div class="stat">
								<div class="stat-title">SECTOR</div>
								<div class="stat-value">
									{data.sector !== undefined ? data.sector + 1 : '--'}
								</div>
							</div>
						</div>

						<!-- Sector 1 -->
						<div class="text-center">
							<div class="stat">
								<div class="stat-title">SECTOR 1</div>
								<div class="stat-value text-sm">
									{#if data.sector === 0}
										{formatLapTime(data.lap_time_ms)}
									{:else}
										{formatLapTime(data.sector_1_time)}
									{/if}
								</div>
								<div class="stat-desc">SEC</div>
							</div>
						</div>

						<!-- Sector 2 -->
						<div class="text-center">
							<div class="stat">
								<div class="stat-title">SECTOR 2</div>
								<div class="stat-value text-sm">
									{#if data.sector === 1}
										{formatLapTime(data.lap_time_ms - data.sector_1_time)}
									{:else if data.sector > 1}
										{formatLapTime(data.sector_2_time)}
									{:else}
										--
									{/if}
								</div>
								<div class="stat-desc">SEC</div>
							</div>
						</div>

						<!-- Sector 3 -->
						<div class="text-center">
							<div class="stat">
								<div class="stat-title">SECTOR 3</div>
								<div class="stat-value text-sm">
									{#if data.sector === 2}
										{formatLapTime(data.lap_time_ms - data.sector_1_time - data.sector_2_time)}
									{:else}
										--
									{/if}
								</div>
								<div class="stat-desc">SEC</div>
							</div>
						</div>
					</div>
				</div>
				</div>
			</div>
		{:else}
			<div class="hero h-64">
				<div class="hero-content text-center">
					<div class="max-w-md">
						<h2 class="animate-pulse text-2xl font-bold">Waiting for telemetry data...</h2>
						<div class="mt-4">
							<span class="loading loading-spinner loading-lg text-primary"></span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
