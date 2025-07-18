import type { BetterAuthOptions } from "../types";

let isBuilding: boolean | undefined;

export const toSvelteKitHandler = (auth: {
	handler: (request: Request) => any;
	options: BetterAuthOptions;
}) => {
	return (event: { request: Request }) => auth.handler(event.request);
};

export const svelteKitHandler = async ({
	auth,
	event,
	resolve,
}: {
	auth: {
		handler: (request: Request) => any;
		options: BetterAuthOptions;
	};
	event: { request: Request; url: URL };
	resolve: (event: any) => any;
}) => {
	// Only check building state once and cache it
	if (isBuilding === undefined) {
		//@ts-expect-error
		const { building } = await import("$app/environment")
			.catch((e) => {})
			.then((m) => m || {});

		isBuilding = building || false;
	}

	if (isBuilding) {
		return resolve(event);
	}
	const { request, url } = event;
	if (isAuthPath(url.toString(), auth.options)) {
		return auth.handler(request);
	}
	return resolve(event);
};

export function isAuthPath(url: string, options: BetterAuthOptions) {
	const _url = new URL(url);
	const baseURL = new URL(
		`${options.baseURL || _url.origin}${options.basePath || "/api/auth"}`,
	);
	if (_url.origin !== baseURL.origin) return false;
	if (
		!_url.pathname.startsWith(
			baseURL.pathname.endsWith("/")
				? baseURL.pathname
				: `${baseURL.pathname}/`,
		)
	)
		return false;
	return true;
}
