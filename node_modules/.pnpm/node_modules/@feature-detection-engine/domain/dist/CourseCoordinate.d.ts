/**
 * A position on the golf hole measured relative to the tee box.
 *
 * Tee Box:
 * upDown = 0
 * leftRight = 0
 */
export interface CourseCoordinate {
    /**
     * Distance from the tee box.
     *
     * Positive = toward the green.
     * Negative = behind the tee.
     */
    upDown: number;
    /**
     * Horizontal distance from the hole centerline.
     *
     * Positive = right.
     * Negative = left.
     */
    leftRight: number;
}
//# sourceMappingURL=CourseCoordinate.d.ts.map