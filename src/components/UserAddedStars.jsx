import { UserStar } from './UserStar'

export function UserAddedStars({ stars }) {
  return (
    <group name="Layer6_UserStars">
      {stars.map((star) => (
        <UserStar
          key={star.id}
          position={star.position}
          color={star.color}
          scale={star.scale}
          random={star.random}
          date={star.date}
        />
      ))}
    </group>
  )
}
