package venue

// TODO: endpoint'ler (venue oluşturma vb.) sonraki iterasyonda eklenecek.
type VenueHandler struct {
	service *VenueService
}

func NewVenueHandler(service *VenueService) *VenueHandler {
	return &VenueHandler{
		service: service,
	}
}
