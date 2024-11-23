import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

interface GateAnimationProps {
  isEntry: boolean;
  isAnimating: boolean;
  onAnimationComplete: () => void;
}

const Scene = styled.div`
  position: relative;
  width: 800px;
  height: 400px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const Grid = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px) 0 0 / 50px 50px,
    linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px) 0 0 / 50px 50px;
  transform: perspective(1000px) rotateX(60deg);
  transform-origin: center;
`;

const Road = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) perspective(1000px) rotateX(60deg);
  width: 120px;
  height: 400px;
  background: #1e1e30;
  border-left: 2px solid rgba(0, 255, 255, 0.3);
  border-right: 2px solid rgba(0, 255, 255, 0.3);
`;

const Gate = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 240px;
  height: 180px;
`;

const GatePost = styled.div`
  position: absolute;
  bottom: 0;
  width: 20px;
  height: 120px;
  background: #2a2a4a;
  border: 2px solid rgba(0, 255, 255, 0.3);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);

  &.left {
    left: 0;
  }

  &.right {
    right: 0;
  }
`;

const GateArm = styled(motion.div)`
  position: absolute;
  top: 30px;
  left: 20px;
  width: 200px;
  height: 12px;
  background: linear-gradient(90deg, #ff3366, #ff3366);
  border: 2px solid rgba(255, 51, 102, 0.5);
  border-radius: 6px;
  transform-origin: left center;
  box-shadow: 
    0 0 10px rgba(255, 51, 102, 0.5),
    0 0 20px rgba(255, 51, 102, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 10px;
    right: 10px;
    height: 2px;
    background: rgba(255, 255, 255, 0.5);
    transform: translateY(-50%);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
`;

const ScanBeam = styled(motion.div)`
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  background: rgba(0, 255, 255, 0.8);
  box-shadow: 
    0 0 10px rgba(0, 255, 255, 0.8),
    0 0 20px rgba(0, 255, 255, 0.4);
`;

const VehicleContainer = styled(motion.div)`
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%) perspective(1000px) rotateX(60deg);
  width: 80px;
  height: 120px;
`;

const VehicleBody = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #0ff;
  border-radius: 10px;
  box-shadow: 
    0 0 20px rgba(0, 255, 255, 0.3),
    inset 0 0 20px rgba(0, 255, 255, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 10%;
    left: 10%;
    width: 80%;
    height: 80%;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 10%;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 4px;
    background: rgba(255, 51, 102, 0.8);
    box-shadow: 0 0 10px rgba(255, 51, 102, 0.5);
  }
`;

const HoverGlow = styled.div`
  position: absolute;
  bottom: -10px;
  left: 10%;
  width: 80%;
  height: 4px;
  background: rgba(0, 255, 255, 0.8);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
  animation: hover 1s infinite alternate ease-in-out;

  @keyframes hover {
    from { opacity: 0.4; transform: translateY(0); }
    to { opacity: 0.8; transform: translateY(-2px); }
  }
`;

const animations = {
  vehicle: {
    entry: {
      y: [400, -100],
      transition: {
        duration: 3,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    },
    exit: {
      y: [-100, 400],
      transition: {
        duration: 3,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    }
  },
  scan: {
    initial: { scaleX: 0, opacity: 0 },
    animate: {
      scaleX: 1,
      opacity: [0, 1, 1, 0],
      transition: {
        duration: 1.5,
        times: [0, 0.2, 0.8, 1]
      }
    }
  },
  gateArm: {
    closed: { rotate: 0 },
    open: { 
      rotate: -85,
      transition: {
        duration: 1,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    }
  }
};

const GateAnimation: React.FC<GateAnimationProps> = ({
  isEntry,
  isAnimating,
  onAnimationComplete
}) => {
  useEffect(() => {
    if (!isAnimating) {
      onAnimationComplete();
    }
  }, [isAnimating, onAnimationComplete]);

  return (
    <Scene>
      <Grid />
      <Road />
      
      <Gate>
        <GatePost className="left" />
        <GatePost className="right" />
        <GateArm
          initial="closed"
          animate={isAnimating ? "open" : "closed"}
          variants={animations.gateArm}
        />
        {isAnimating && (
          <motion.div
            initial={animations.scan.initial}
            animate={animations.scan.animate}
          >
            <ScanBeam />
          </motion.div>
        )}
      </Gate>

      <AnimatePresence>
        {isAnimating && (
          <VehicleContainer
            initial={{ y: isEntry ? 400 : -100 }}
            animate={{ y: isEntry ? -100 : 400 }}
            transition={{
              duration: 3,
              ease: [0.43, 0.13, 0.23, 0.96]
            }}
            onAnimationComplete={() => {
              if (isAnimating) {
                setTimeout(onAnimationComplete, 500);
              }
            }}
          >
            <VehicleBody />
            <HoverGlow />
          </VehicleContainer>
        )}
      </AnimatePresence>
    </Scene>
  );
};

export default GateAnimation;
