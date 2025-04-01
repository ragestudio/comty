/**
 * ServiceManager class - Manages a collection of services
 * Provides methods to interact with multiple services
 */
export default class ServiceManager {
	constructor() {
		this.services = []
		this.selectedService = null
	}

	/**
	 * Add a service to the manager
	 * @param {Service} service - Service to add
	 */
	addService(service) {
		this.services.push(service)
	}

	/**
	 * Get a service by ID
	 * @param {string} id - Service ID or index
	 * @returns {Service} The service or null if not found
	 */
	getService(id) {
		// If ID is a number, treat it as an index
		if (!isNaN(parseInt(id))) {
			return this.services[parseInt(id)] || null
		}

		// Otherwise look up by ID
		return this.services.find((service) => service.id === id) || null
	}

	/**
	 * Get the currently selected service
	 * @returns {Service|string|null} The selected service, "all", or null
	 */
	getSelectedService() {
		return this.selectedService
	}

	/**
	 * Set the currently selected service
	 * @param {string} id - Service ID, index, or "all"
	 * @returns {boolean} True if selection was successful
	 */
	selectService(id) {
		if (id === "all") {
			this.selectedService = "all"
			return true
		}

		const service = this.getService(id)

		if (!service) {
			console.error(`Service [${id}] not found`)
			return false
		}

		this.selectedService = service
		return true
	}

	/**
	 * Reload all services
	 */
	reloadAllServices() {
		for (const service of this.services) {
			service.reload()
		}
	}

	/**
	 * Stop all services
	 */
	stopAllServices() {
		for (const service of this.services) {
			service.stop()
		}
	}

	/**
	 * Attach to a specific service's standard output
	 * @param {string} id - Service ID or index
	 * @returns {boolean} True if attachment was successful
	 */
	attachServiceStd(id) {
		if (id === "all") {
			this.selectedService = "all"
			this.attachAllServicesStd()
			return true
		}

		const service = this.getService(id)

		if (!service) {
			console.error(`Service [${id}] not found`)
			return false
		}

		// Detach from all first
		this.detachAllServicesStd()

		// Then attach to the selected one
		console.clear()
		service.attachStd()
		this.selectedService = service

		return true
	}

	/**
	 * Detach from a specific service's standard output
	 * @param {string} id - Service ID or index
	 */
	detachServiceStd(id) {
		const service = this.getService(id)
		if (service) {
			service.detachStd()
		}
	}

	/**
	 * Attach to all services' standard output
	 */
	attachAllServicesStd() {
		this.detachAllServicesStd()

		for (const service of this.services) {
			service.attachStd()
		}

		this.selectedService = "all"
	}

	/**
	 * Detach from all services' standard output
	 */
	detachAllServicesStd() {
		for (const service of this.services) {
			service.detachStd()
		}
	}
}
