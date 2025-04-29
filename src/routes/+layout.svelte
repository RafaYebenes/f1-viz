<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<main class="mx-auto my-20 max-w-2xl">
	{@render children()}
</main>
