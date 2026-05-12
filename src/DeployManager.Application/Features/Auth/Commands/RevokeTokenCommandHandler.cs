using MediatR;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Auth.Commands;

public class RevokeTokenCommandHandler : IRequestHandler<RevokeTokenCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public RevokeTokenCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(RevokeTokenCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Repository<Domain.Entities.User>().GetByIdAsync(request.UserId, cancellationToken);
        if (user is null) return;

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
