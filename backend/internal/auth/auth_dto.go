package auth

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (r *LoginRequest) Validate() error {
	if r.Username == "" {
		return ErrUsernameRequired
	}

	if r.Password == "" {
		return ErrPasswordRequired
	}

	return nil
}

// CreateAdminRequest, boss'un yeni bir admin hesabı açması için kullanılır.
type CreateAdminRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (r *CreateAdminRequest) Validate() error {
	if r.Username == "" {
		return ErrUsernameRequired
	}

	if r.Password == "" {
		return ErrPasswordRequired
	}

	return nil
}
